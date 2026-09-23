import { afterEach, describe, expect, it, vi } from 'vitest'

import { env } from '../config/env'
import {
  created,
  fail,
  mockFetch,
  ok,
  passThrough,
  registerMockRoutes,
  resetMockRoutes,
} from './mockServer'

afterEach(() => {
  resetMockRoutes()
  vi.restoreAllMocks()
})

describe('mockFetch', () => {
  it('matches method + path and resolves :params', async () => {
    registerMockRoutes([
      {
        method: 'GET',
        path: '/api/orders/:id',
        handler: ({ params }) => ok({ id: params.id }),
      },
    ])

    const response = await mockFetch(`${env.apiBaseUrl}/api/orders/ORD-1`, {
      method: 'GET',
    })
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toMatchObject({ success: true, data: { id: 'ORD-1' } })
  })

  it('passes query, body and headers into the handler context', async () => {
    registerMockRoutes([
      {
        method: 'POST',
        path: '/api/orders/:id/approval',
        handler: ({ params, query, body, headers }) =>
          created({
            id: params.id,
            page: query.get('page'),
            decision: (body as { decision: string }).decision,
            accept: headers.get('Accept'),
          }),
      },
    ])

    const response = await mockFetch(
      `${env.apiBaseUrl}/api/orders/ORD-1/approval?page=2`,
      {
        method: 'POST',
        body: JSON.stringify({ decision: 'REJECTED' }),
        headers: { Accept: 'application/json' },
      },
    )
    const body = await response.json()

    expect(response.status).toBe(201)
    expect(body.data).toEqual({
      id: 'ORD-1',
      page: '2',
      decision: 'REJECTED',
      accept: 'application/json',
    })
  })

  it('returns the status/code/message from fail()', async () => {
    registerMockRoutes([
      {
        method: 'GET',
        path: '/api/orders/:id',
        handler: () => fail(404, 'NOT_FOUND', 'Order not found'),
      },
    ])

    const response = await mockFetch(`${env.apiBaseUrl}/api/orders/missing`)
    const body = await response.json()

    expect(response.status).toBe(404)
    expect(body).toMatchObject({
      success: false,
      code: 'NOT_FOUND',
      message: 'Order not found',
    })
  })

  it('falls through to the real fetch when no route matches', async () => {
    const realResponse = new Response('{}', { status: 200 })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(realResponse)

    const url = `${env.apiBaseUrl}/api/unmocked-endpoint`
    const response = await mockFetch(url, { method: 'GET' })

    expect(fetchSpy).toHaveBeenCalledWith(url, { method: 'GET' })
    expect(response).toBe(realResponse)
  })

  it('forwards to the real fetch when a matched handler returns passThrough()', async () => {
    const realResponse = new Response('{}', { status: 200 })
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(realResponse)

    registerMockRoutes([
      {
        method: 'POST',
        path: '/api/v1/auth/login',
        handler: () => passThrough(),
      },
    ])

    const init = { method: 'POST', body: JSON.stringify({ email: 'x' }) }
    const url = `${env.apiBaseUrl}/api/v1/auth/login`
    const response = await mockFetch(url, init)

    expect(fetchSpy).toHaveBeenCalledWith(url, init)
    expect(response).toBe(realResponse)
  })

  it('does not delay when env.mockLatencyMs is 0 (test mode)', async () => {
    expect(env.mockLatencyMs).toBe(0)

    registerMockRoutes([
      { method: 'GET', path: '/api/ping', handler: () => ok({ pong: true }) },
    ])

    const start = Date.now()
    await mockFetch(`${env.apiBaseUrl}/api/ping`)
    expect(Date.now() - start).toBeLessThan(50)
  })
})
