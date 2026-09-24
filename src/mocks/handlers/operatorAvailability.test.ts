import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import '../index'

const base = env.apiBaseUrl

async function call(method: string, path: string, body?: unknown) {
  const response = await mockFetch(`${base}${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, payload: await response.json() }
}

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('GET /api/operator/availability', () => {
  it('returns the seeded week', async () => {
    const { status, payload } = await call('GET', '/api/operator/availability?week=2026-W39')
    expect(status).toBe(200)
    expect(payload.data.week).toBe('2026-W39')
    expect(payload.data.slots['2026-09-21T07:00']).toBe('AVAILABLE')
  })

  it('returns empty slots for an unseeded week', async () => {
    const { status, payload } = await call('GET', '/api/operator/availability?week=2026-W40')
    expect(status).toBe(200)
    expect(payload.data.slots).toEqual({})
  })

  it('requires week', async () => {
    const { status } = await call('GET', '/api/operator/availability')
    expect(status).toBe(400)
  })
})

describe('PUT /api/operator/availability', () => {
  it('saves slots and is readable back', async () => {
    const body = { week: '2026-W39', slots: { '2026-09-21T07:00': 'OFF' } }
    const put = await call('PUT', '/api/operator/availability', body)
    expect(put.status).toBe(200)

    const get = await call('GET', '/api/operator/availability?week=2026-W39')
    expect(get.payload.data.slots['2026-09-21T07:00']).toBe('OFF')
  })

  it('requires week and slots', async () => {
    const { status } = await call('PUT', '/api/operator/availability', { week: '2026-W39' })
    expect(status).toBe(400)
  })
})
