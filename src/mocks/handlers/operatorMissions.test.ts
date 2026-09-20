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

describe('POST /api/operator/missions/:id/accept', () => {
  it('accepts a pending mission', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0152-1/accept',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('ACCEPTED')
    expect(payload.data.acceptedAt).toBeTruthy()
  })

  it('rejects accept on a non-pending mission', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0141-1/accept',
    )
    expect(status).toBe(409)
    expect(payload.success).toBe(false)
  })

  it('404s for unknown mission', async () => {
    const { status } = await call('POST', '/api/operator/missions/NOPE/accept')
    expect(status).toBe(404)
  })
})

describe('POST /api/operator/missions/:id/reject', () => {
  it('rejects a pending mission with reason', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0152-1/reject',
      { reason: 'Trùng lịch cá nhân', notes: 'Đã có lịch bay khác' },
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('REJECTED')
    expect(payload.data.rejectReason).toContain('Trùng lịch cá nhân')
  })

  it('requires a reason', async () => {
    const { status } = await call('POST', '/api/operator/missions/MSN-2609-0152-1/reject', {})
    expect(status).toBe(400)
  })

  it('rejects reject on a non-pending mission', async () => {
    const { status } = await call('POST', '/api/operator/missions/MSN-2609-0141-1/reject', {
      reason: 'Lý do khác',
    })
    expect(status).toBe(409)
  })
})
