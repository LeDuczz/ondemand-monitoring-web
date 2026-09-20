import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import '../index'

const base = env.apiBaseUrl

async function call(method: string, path: string) {
  const response = await mockFetch(`${base}${path}`, { method })
  return { status: response.status, payload: await response.json() }
}

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('GET /api/operator/profile', () => {
  it('returns the operator profile', async () => {
    const { status, payload } = await call('GET', '/api/operator/profile')
    expect(status).toBe(200)
    expect(payload.data.fullName).toBe('Hoàng Đức Thắng')
    expect(payload.data.certExpiry).toBe('2026-10-11')
  })
})

describe('GET /api/operator/missions', () => {
  it('returns all missions with no tab filter', async () => {
    const { status, payload } = await call('GET', '/api/operator/missions')
    expect(status).toBe(200)
    expect(payload.data.items).toHaveLength(8)
  })

  it('filters by tab=pending', async () => {
    const { payload } = await call('GET', '/api/operator/missions?tab=pending')
    expect(payload.data.items).toHaveLength(2)
    expect(payload.data.items.every((m: { status: string }) => m.status === 'PENDING')).toBe(
      true,
    )
  })

  it('filters by tab=upcoming', async () => {
    const { payload } = await call('GET', '/api/operator/missions?tab=upcoming')
    expect(payload.data.items).toHaveLength(3)
  })

  it('filters by tab=history', async () => {
    const { payload } = await call('GET', '/api/operator/missions?tab=history')
    expect(payload.data.items).toHaveLength(3)
  })

  it('rejects an unknown tab', async () => {
    const { status, payload } = await call('GET', '/api/operator/missions?tab=bogus')
    expect(status).toBe(400)
    expect(payload.success).toBe(false)
  })
})

describe('GET /api/operator/missions/:id', () => {
  it('returns a single mission', async () => {
    const { status, payload } = await call('GET', '/api/operator/missions/MSN-2609-0152-1')
    expect(status).toBe(200)
    expect(payload.data.id).toBe('MSN-2609-0152-1')
  })

  it('404s for an unknown id', async () => {
    const { status } = await call('GET', '/api/operator/missions/does-not-exist')
    expect(status).toBe(404)
  })
})
