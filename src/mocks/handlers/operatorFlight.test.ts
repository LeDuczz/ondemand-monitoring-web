import { afterEach, describe, it, expect, beforeEach } from 'vitest'
import {
  registerMockRoutes,
  resetMockRoutes,
  mockFetch,
  ok,
  fail,
} from '../mockServer'
import mediaData from '../data/operator-media.json'
import missionsData from '../data/operator-missions.json'
import type { MediaFile } from '../../features/drone-operator/omss/types'

function setupRoutes() {
  const mediaStore: Record<string, MediaFile[]> = {
    [mediaData.missionId]: JSON.parse(JSON.stringify(mediaData.files)) as MediaFile[],
  }

  registerMockRoutes([
    {
      method: 'POST',
      path: '/api/operator/missions/:id/connect',
      handler: ({ params, body }) => {
        const payload = body as { token?: string; gcsId?: string }
        if (!payload?.token) return fail(400, 'BAD_REQUEST', 'Thiếu token kết nối')
        const device = missionsData.gcsDevices.find((d) => d.id === payload.gcsId)
        return ok({
          connection: {
            id: `CONN-TEST`,
            missionId: params['id'],
            droneId: 'DRN-02',
            gcsId: payload.gcsId ?? '',
            tokenUsedAt: new Date().toISOString(),
            connectedAt: new Date().toISOString(),
            status: 'CONNECTED',
          },
          gcsDevices: missionsData.gcsDevices,
          gcsLabel: device?.label ?? payload.gcsId,
        })
      },
    },
    {
      method: 'POST',
      path: '/api/operator/missions/:id/handover',
      handler: () => ok({ confirmedAt: new Date().toISOString() }),
    },
    {
      method: 'POST',
      path: '/api/operator/missions/:id/preflight',
      handler: ({ body }) => {
        const payload = body as { items?: Array<{ id: string; status: string }> }
        const anyFail = payload?.items?.some((i) => i.status === 'FAIL') ?? false
        return ok({ result: anyFail ? 'FAIL' : 'PASS' })
      },
    },
    {
      method: 'POST',
      path: '/api/operator/missions/:id/postflight',
      handler: ({ params }) => ok({ id: params['id'], state: 'COMPLETED' }),
    },
    {
      method: 'POST',
      path: '/api/operator/missions/:id/maintenance-ticket',
      handler: () => ok({ ticketId: `TKT-TEST`, createdAt: new Date().toISOString() }),
    },
    {
      method: 'GET',
      path: '/api/operator/missions/:id/media',
      handler: ({ params }) => {
        const files = mediaStore[params['id']] ?? []
        return ok({ files })
      },
    },
    {
      method: 'POST',
      path: '/api/operator/missions/:id/media/:fileId/retry',
      handler: ({ params }) => {
        const files = mediaStore[params['id']]
        if (!files) return fail(404, 'NOT_FOUND', 'Mission không tồn tại')
        const idx = files.findIndex((f) => f.id === params['fileId'])
        if (idx === -1) return fail(404, 'NOT_FOUND', 'File không tồn tại')
        const file = files[idx]!
        if (file.attempts >= file.maxAttempts) {
          return fail(422, 'MAX_RETRIES', 'Đã đạt số lần thử tối đa')
        }
        files[idx] = { ...file, status: 'UPLOADING', attempts: file.attempts + 1, progressPct: 0 }
        return ok(files[idx])
      },
    },
  ])
}

describe('operatorFlight mock handlers', () => {
  beforeEach(() => {
    setupRoutes()
  })

  afterEach(() => {
    resetMockRoutes()
  })

  it('POST /connect with valid token returns CONNECTED', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0142-1/connect',
      {
        method: 'POST',
        body: JSON.stringify({ token: 'FT-ABCD1234', gcsId: 'DJI-RC-PLUS-7A31' }),
        headers: { 'Content-Type': 'application/json' },
      },
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.connection.status).toBe('CONNECTED')
    expect(json.data.gcsDevices.length).toBeGreaterThan(0)
  })

  it('POST /connect without token returns 400', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0142-1/connect',
      { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } },
    )
    const json = await res.json()
    expect(res.status).toBe(400)
    expect(json.success).toBe(false)
  })

  it('POST /handover returns confirmedAt timestamp', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0142-1/handover',
      { method: 'POST' },
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.confirmedAt).toBeDefined()
  })

  it('POST /preflight with all PASS returns PASS', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0142-1/preflight',
      {
        method: 'POST',
        body: JSON.stringify({ items: [{ id: 'battery', status: 'PASS' }, { id: 'gps', status: 'PASS' }] }),
        headers: { 'Content-Type': 'application/json' },
      },
    )
    const json = await res.json()
    expect(json.data.result).toBe('PASS')
  })

  it('POST /preflight with FAIL item returns FAIL', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0142-1/preflight',
      {
        method: 'POST',
        body: JSON.stringify({ items: [{ id: 'battery', status: 'FAIL' }] }),
        headers: { 'Content-Type': 'application/json' },
      },
    )
    const json = await res.json()
    expect(json.data.result).toBe('FAIL')
  })

  it('GET /media returns 20 files for MSN-2609-0142-1', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0142-1/media',
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.files).toHaveLength(20)
  })

  it('GET /media returns empty array for unknown mission', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions/UNKNOWN/media',
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.files).toEqual([])
  })

  it('POST /postflight returns COMPLETED state', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0142-1/postflight',
      { method: 'POST', body: JSON.stringify({ items: [] }), headers: { 'Content-Type': 'application/json' } },
    )
    const json = await res.json()
    expect(json.data.state).toBe('COMPLETED')
  })

  it('POST /maintenance-ticket returns a ticket id', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0142-1/maintenance-ticket',
      {
        method: 'POST',
        body: JSON.stringify({ issueType: 'MOTOR_VIBRATION', severity: 'MEDIUM', description: 'test' }),
        headers: { 'Content-Type': 'application/json' },
      },
    )
    const json = await res.json()
    expect(json.data.ticketId).toBeDefined()
  })

  it('POST /media/retry returns 422 for max retries exceeded', async () => {
    // f20 has 3/3 attempts
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0142-1/media/f20/retry',
      { method: 'POST' },
    )
    const json = await res.json()
    expect(res.status).toBe(422)
    expect(json.success).toBe(false)
  })
})
