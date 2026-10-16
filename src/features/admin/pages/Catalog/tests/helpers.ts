import { afterEach, beforeEach } from 'vitest'

import { mockFetch } from '../../../../../mocks'
import '../../../../../mocks/index'
import { resetMockDb } from '../../../../../mocks/db'
import { stubApi, stubError } from '../../../../../test/stubApi'
import { catalogTimes } from '../../../../customer/tests/createOrderFixtures'
import type { PreferredTimeResponse } from '../../../api/catalogApi'

// `/api/preferred-times*` is served by the real backend (no mock route), so it
// is stubbed here over the shared catalog fixtures. Stations are still mocked,
// so unmatched requests fall through to mockFetch.
const TIME_CODES = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT']

export function stubPreferredTimes() {
  const times: PreferredTimeResponse[] = structuredClone(catalogTimes)
  let seq = 100
  const find = (id: string) => times.find((t) => t.id === id)
  const notFound = () => stubError(404, 'NOT_FOUND', 'Preferred time not found')
  return stubApi(
    [
      { path: '/api/preferred-times', respond: () => [...times] },
      {
        method: 'POST',
        path: '/api/preferred-times',
        respond: ({ body }) => {
          const b = (body ?? {}) as Partial<PreferredTimeResponse>
          const errors: Record<string, string> = {}
          for (const k of ['code', 'name', 'startTime', 'endTime'] as const) {
            if (!b[k]) errors[k] = `${k} is required`
          }
          if (b.code && !TIME_CODES.includes(b.code)) errors.code = 'Invalid code'
          if (Object.keys(errors).length)
            return stubError(400, 'VALIDATION_ERROR', 'Validation failed', errors)
          if (times.some((t) => t.code === b.code))
            return stubError(409, 'CONFLICT', 'Preferred time code already exists', {
              code: 'Code already exists',
            })
          const pt = { id: `pt-${++seq}`, ...b } as PreferredTimeResponse
          times.push(pt)
          return pt
        },
      },
      {
        path: '/api/preferred-times/:id',
        respond: ({ params }) => find(params.id) ?? notFound(),
      },
      {
        method: 'PUT',
        path: '/api/preferred-times/:id',
        respond: ({ params, body }) => {
          const pt = find(params.id)
          if (!pt) return notFound()
          return Object.assign(pt, body as object)
        },
      },
      {
        method: 'DELETE',
        path: '/api/preferred-times/:id',
        respond: ({ params }) => {
          const i = times.findIndex((t) => t.id === params.id)
          if (i < 0) return notFound()
          times.splice(i, 1)
          return undefined
        },
      },
    ],
    { fallback: mockFetch },
  )
}

export function useMockTransport() {
  let stub: ReturnType<typeof stubPreferredTimes> | undefined
  beforeEach(() => {
    resetMockDb()
    stub = stubPreferredTimes()
  })
  afterEach(() => {
    resetMockDb()
    stub?.restore()
  })
}
