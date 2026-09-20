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
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0152-1/reject',
      {},
    )
    expect(status).toBe(400)
  })

  it('rejects reject on a non-pending mission', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0141-1/reject',
      {
        reason: 'Lý do khác',
      },
    )
    expect(status).toBe(409)
  })
})

describe('POST /api/operator/missions/:id/connect', () => {
  it('connects with a token and gcs id', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/connect',
      { token: 'K7F2-9QXM-D3TR', gcsId: 'DJI-RC-PLUS-7A31' },
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('CONNECTED')
    expect(payload.data.connectedAt).toBeTruthy()
  })

  it('requires a token', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/connect',
      {
        gcsId: 'DJI-RC-PLUS-7A31',
      },
    )
    expect(status).toBe(400)
  })

  it('requires a gcsId', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/connect',
      {
        token: 'K7F2-9QXM-D3TR',
      },
    )
    expect(status).toBe(400)
  })

  it('404s for unknown mission', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/NOPE/connect',
      {
        token: 'x',
        gcsId: 'y',
      },
    )
    expect(status).toBe(404)
  })
})

describe('POST /api/operator/missions/:id/handover', () => {
  it('requires the drone to be connected first', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/handover',
    )
    expect(status).toBe(409)
  })

  it('confirms handover after a successful connect', async () => {
    await call('POST', '/api/operator/missions/MSN-2609-0142-1/connect', {
      token: 'K7F2-9QXM-D3TR',
      gcsId: 'DJI-RC-PLUS-7A31',
    })
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/handover',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('CONFIRMED')
    expect(payload.data.confirmedAt).toBeTruthy()
  })

  it('404s for unknown mission', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/NOPE/handover',
    )
    expect(status).toBe(404)
  })
})

describe('POST /api/operator/missions/:id/preflight', () => {
  it('saves a checklist of items', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/preflight',
      { items: [{ key: 'battery', result: 'ok' }] },
    )
    expect(status).toBe(200)
    expect(payload.data.items).toHaveLength(1)
    expect(payload.data.savedAt).toBeTruthy()
  })

  it('requires a note when an item fails', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/preflight',
      { items: [{ key: 'weather', result: 'fail' }] },
    )
    expect(status).toBe(400)
  })

  it('accepts a fail item with a note', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/preflight',
      { items: [{ key: 'weather', result: 'fail', note: 'Gió giật mạnh' }] },
    )
    expect(status).toBe(200)
  })

  it('requires items', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/MSN-2609-0142-1/preflight',
      {},
    )
    expect(status).toBe(400)
  })

  it('404s for unknown mission', async () => {
    const { status } = await call(
      'POST',
      '/api/operator/missions/NOPE/preflight',
      {
        items: [{ key: 'battery', result: 'ok' }],
      },
    )
    expect(status).toBe(404)
  })
})
