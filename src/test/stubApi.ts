// Test-only HTTP stub for endpoints the real backend serves (and which
// therefore have no mock route). Installs an `apiRequest` transport that
// matches `METHOD /path/:param` routes, records every call, and answers with
// the standard `ApiResponse` envelope. Unmatched requests answer 404 (or go to
// `options.fallback`, e.g. `mockFetch` for the endpoints that are still mocked).
import { vi } from 'vitest'

import {
  resetHttpTransport,
  setHttpTransport,
  type HttpTransport,
} from '../shared/api/httpClient'

export type StubCall = {
  method: string
  path: string
  url: string
  query: URLSearchParams
  body: unknown
}

export type StubContext = StubCall & { params: Record<string, string> }

/** Return `stubError(...)` from a responder to answer with an error envelope. */
export type StubError = {
  __stubError: true
  status: number
  code: string
  message: string
  errors?: Record<string, string>
}

export function stubError(
  status: number,
  code: string,
  message = code,
  errors?: Record<string, string>,
): StubError {
  return { __stubError: true, status, code, message, errors }
}

type StubData =
  | string
  | number
  | boolean
  | null
  | unknown[]
  | Record<string, unknown>

export type StubRoute = {
  method?: string
  path: string
  /** Static `data` or a function of the request; omit for an empty `data`. */
  respond?:
    | ((ctx: StubContext) => unknown | Promise<unknown>)
    | StubData
}

function compile(path: string) {
  const names: string[] = []
  const source = path
    .split('/')
    .map((seg) => {
      if (seg.startsWith(':')) {
        names.push(seg.slice(1))
        return '([^/]+)'
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    })
    .join('/')
  return { regex: new RegExp(`^${source}$`), names }
}

function envelope(status: number, body: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ ...body, timestamp: new Date().toISOString() }),
    { status, headers: { 'Content-Type': 'application/json' } },
  )
}

/**
 * Installs the stub transport. Call `stub.restore()` (or use
 * `useStubApi` below) in `afterEach`. Later routes do not shadow earlier
 * ones: the first match wins, so list specific paths before generic ones.
 */
function createStub(
  routes: StubRoute[],
  options: { fallback?: HttpTransport } = {},
) {
  const compiled = routes.map((r) => ({
    ...r,
    method: (r.method ?? 'GET').toUpperCase(),
    ...compile(r.path),
  }))
  const calls: StubCall[] = []

  const transport: HttpTransport = async (input, init) => {
    const method = (init?.method ?? 'GET').toUpperCase()
    const url = new URL(input, 'http://stub.local')
    let body: unknown
    if (typeof init?.body === 'string') {
      try {
        body = JSON.parse(init.body)
      } catch {
        body = init.body
      }
    } else if (init?.body != null) {
      body = init.body
    }
    const call: StubCall = {
      method,
      path: url.pathname,
      url: `${url.pathname}${url.search}`,
      query: url.searchParams,
      body,
    }
    calls.push(call)

    for (const route of compiled) {
      if (route.method !== method) continue
      const match = route.regex.exec(url.pathname)
      if (!match) continue
      const params: Record<string, string> = {}
      route.names.forEach((n, i) => {
        params[n] = decodeURIComponent(match[i + 1] ?? '')
      })
      const result =
        typeof route.respond === 'function'
          ? await (route.respond as (c: StubContext) => unknown)({
              ...call,
              params,
            })
          : route.respond
      if (
        result &&
        typeof result === 'object' &&
        (result as StubError).__stubError
      ) {
        const e = result as StubError
        return envelope(e.status, {
          success: false,
          code: e.code,
          message: e.message,
          errors: e.errors,
        })
      }
      return envelope(200, {
        success: true,
        code: 'OK',
        message: 'OK',
        data: result,
      })
    }
    if (options.fallback) return options.fallback(input, init)
    return envelope(404, {
      success: false,
      code: 'STUB_NOT_FOUND',
      message: `No stub for ${method} ${url.pathname}`,
    })
  }

  return {
    transport,
    calls,
    /** Calls matching `METHOD /path` (exact pathname). */
    callsTo(method: string, path: string) {
      return calls.filter((c) => c.method === method && c.path === path)
    },
  }
}

/** Stubs the `apiRequest` transport (use for anything going through httpClient). */
export function stubApi(
  routes: StubRoute[],
  options: { fallback?: HttpTransport } = {},
) {
  const stub = createStub(routes, options)
  setHttpTransport(stub.transport)
  return { ...stub, restore: resetHttpTransport }
}

/**
 * Stubs `globalThis.fetch` for callers that bypass httpClient (e.g. the auth
 * API's own `request`). Restore with `vi.restoreAllMocks()` or `.restore()`.
 */
export function stubFetch(routes: StubRoute[]) {
  const stub = createStub(routes)
  const spy = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation((input, init) =>
      stub.transport(
        typeof input === 'string' ? input : String((input as Request).url ?? input),
        init,
      ),
    )
  return { ...stub, spy, restore: () => spy.mockRestore() }
}
