/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import '../index'

const base = env.apiBaseUrl

async function call(
  method: string,
  path: string,
  body?: unknown,
): Promise<{ status: number; payload: any }> {
  const response = await mockFetch(`${base}${path}`, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, payload: await response.json() }
}

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

// Seed data summary (9 orders):
// cus-ord-001: IN_PROGRESS (has live mission msn-001-1)
// cus-ord-002: AI_ANALYZED
// cus-ord-003: SUBMITTED   (canCancel=true)
// cus-ord-004: SCHEDULED   (canCancel=true, has missions)
// cus-ord-005: APPROVED    (canCancel=true)
// cus-ord-006: COMPLETED   (hasNewMedia=true)
// cus-ord-007: REJECTED
// cus-ord-008: DRAFT
// cus-ord-009: CANCELLED

describe('GET /api/customer/dashboard', () => {
  it('returns KPI counts matching the seed data', async () => {
    const { status, payload } = await call('GET', '/api/customer/dashboard')
    expect(status).toBe(200)
    const d = payload.data
    // PENDING = 0 in new seed (IN_PROGRESS is the active one)
    expect(d.inProgressCount).toBe(1)
    expect(d.completedCount).toBe(1)
    expect(d.newMediaCount).toBe(1) // cus-ord-006 has hasNewMedia=true
    expect(d.recentOrders).toHaveLength(5)
  })

  it('includes activeLiveMission when a mission has hasLive=true', async () => {
    const { payload } = await call('GET', '/api/customer/dashboard')
    const live = payload.data.activeLiveMission
    expect(live).not.toBeNull()
    expect(live.orderId).toBe('cus-ord-001')
    expect(live.missionCode).toBe('MSN-2609-0142-1')
  })

  it('recent orders are sorted newest-first (submittedAt desc)', async () => {
    const { payload } = await call('GET', '/api/customer/dashboard')
    const orders = payload.data.recentOrders as Array<{ submittedAt: string | null }>
    const datesWithValue = orders.filter((o) => o.submittedAt)
    const dates = datesWithValue.map((o) => new Date(o.submittedAt!).getTime())
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i])
    }
  })
})

describe('GET /api/customer/orders', () => {
  it('returns all 9 seeded orders with no filter', async () => {
    const { status, payload } = await call('GET', '/api/customer/orders')
    expect(status).toBe(200)
    expect(payload.data.items).toHaveLength(9)
  })

  it('filters by status=IN_PROGRESS', async () => {
    const { status, payload } = await call('GET', '/api/customer/orders?status=IN_PROGRESS')
    expect(status).toBe(200)
    const items = payload.data.items as Array<{ status: string }>
    expect(items.length).toBeGreaterThan(0)
    items.forEach((o) => expect(o.status).toBe('IN_PROGRESS'))
  })

  it('filters by status=COMPLETED', async () => {
    const { payload } = await call('GET', '/api/customer/orders?status=COMPLETED')
    const items = payload.data.items as Array<{ status: string }>
    items.forEach((o) => expect(o.status).toBe('COMPLETED'))
  })

  it('filters by status=DRAFT', async () => {
    const { payload } = await call('GET', '/api/customer/orders?status=DRAFT')
    const items = payload.data.items as Array<{ status: string }>
    expect(items.length).toBeGreaterThan(0)
    items.forEach((o) => expect(o.status).toBe('DRAFT'))
  })

  it('filters by status=AI_ANALYZED', async () => {
    const { payload } = await call('GET', '/api/customer/orders?status=AI_ANALYZED')
    const items = payload.data.items as Array<{ status: string }>
    expect(items.length).toBeGreaterThan(0)
    items.forEach((o) => expect(o.status).toBe('AI_ANALYZED'))
  })

  it('returns items with canCancel field', async () => {
    const { payload } = await call('GET', '/api/customer/orders')
    const items = payload.data.items as Array<{ canCancel: boolean }>
    expect(items.every((o) => typeof o.canCancel === 'boolean')).toBe(true)
  })
})

describe('GET /api/customer/orders/:id', () => {
  it('returns full detail for a known id', async () => {
    const { status, payload } = await call('GET', '/api/customer/orders/cus-ord-001')
    expect(status).toBe(200)
    const d = payload.data
    expect(d.id).toBe('cus-ord-001')
    expect(d.orderCode).toBe('ORD-2609-0142')
    expect(d.status).toBe('IN_PROGRESS')
    expect(Array.isArray(d.missions)).toBe(true)
    expect(Array.isArray(d.statusHistory)).toBe(true)
  })

  it('returns full detail when looked up by orderCode', async () => {
    const { status, payload } = await call('GET', '/api/customer/orders/ORD-2609-0138')
    expect(status).toBe(200)
    expect(payload.data.id).toBe('cus-ord-004')
    expect(payload.data.missions).toHaveLength(2)
  })

  it('includes failureReason on failed missions', async () => {
    const { payload } = await call('GET', '/api/customer/orders/cus-ord-004')
    const missions = payload.data.missions as Array<{ status: string; failureReason: string | null }>
    const failed = missions.find((m) => m.status === 'FAILED')
    expect(failed).toBeDefined()
    expect(typeof failed?.failureReason).toBe('string')
  })

  it('includes statusHistory array', async () => {
    const { payload } = await call('GET', '/api/customer/orders/cus-ord-001')
    expect(Array.isArray(payload.data.statusHistory)).toBe(true)
    expect(payload.data.statusHistory.length).toBeGreaterThan(0)
  })

  it('includes aiSummary when available', async () => {
    const { payload } = await call('GET', '/api/customer/orders/cus-ord-002')
    const ai = payload.data.aiSummary
    expect(ai).not.toBeNull()
    expect(ai.verdict).toBe('RISKY')
  })

  it('returns 404 for unknown id', async () => {
    const { status, payload } = await call('GET', '/api/customer/orders/no-such-id')
    expect(status).toBe(404)
    expect(payload.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/customer/orders', () => {
  it('creates a new DRAFT order and returns its detail', async () => {
    const { status, payload } = await call('POST', '/api/customer/orders', {
      title: 'Test order từ test suite',
      preferredDate: '2026-10-01',
      serviceIds: ['svc-survey'],
      addressText: 'Quận 9, TP.HCM',
      centerLat: 10.8,
      centerLon: 106.8,
      radiusM: 300,
      preferredTimeName: 'Sáng 08:00–12:00',
    })
    expect(status).toBe(200)
    expect(payload.data.status).toBe('DRAFT')
    expect(payload.data.title).toBe('Test order từ test suite')
  })

  it('returns 400 when title is blank', async () => {
    const { status, payload } = await call('POST', '/api/customer/orders', {
      title: '   ',
      preferredDate: '2026-10-01',
    })
    expect(status).toBe(400)
    expect(payload.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when preferredDate is missing', async () => {
    const { status, payload } = await call('POST', '/api/customer/orders', {
      title: 'Valid title',
    })
    expect(status).toBe(400)
    expect(payload.code).toBe('VALIDATION_ERROR')
  })

  it('new order appears in the list after creation', async () => {
    await call('POST', '/api/customer/orders', {
      title: 'New order for list check',
      preferredDate: '2026-10-02',
      serviceIds: ['svc-agri'],
      addressText: 'Long An',
      centerLat: 10.5,
      centerLon: 106.5,
      radiusM: 200,
      preferredTimeName: 'Sáng 08:00–12:00',
    })
    const { payload } = await call('GET', '/api/customer/orders')
    expect(payload.data.items).toHaveLength(10)
  })
})

describe('POST /api/customer/orders/:id/cancel', () => {
  it('cancels a SUBMITTED order (cus-ord-003)', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-003/cancel',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('CANCELLED')
  })

  it('cancels an APPROVED order (cus-ord-005)', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-005/cancel',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('CANCELLED')
  })

  it('returns 409 for IN_PROGRESS order (cus-ord-001)', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-001/cancel',
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('CANNOT_CANCEL')
  })

  it('returns 409 for COMPLETED order (cus-ord-006)', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-006/cancel',
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('CANNOT_CANCEL')
  })

  it('returns 404 for unknown id', async () => {
    const { status } = await call('POST', '/api/customer/orders/no-such/cancel')
    expect(status).toBe(404)
  })
})

describe('POST /api/customer/orders/:id/submit', () => {
  it('submits a DRAFT order', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-008/submit',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('SUBMITTED')
    expect(payload.data.submittedAt).not.toBeNull()
  })

  it('submits an AI_ANALYZED order', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-002/submit',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('SUBMITTED')
  })

  it('returns 409 for already SUBMITTED order', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-003/submit',
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('INVALID_STATE')
  })
})

describe('GET /api/customer/orders/:id/analysis', () => {
  it('returns AI analysis for cus-ord-002', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/customer/orders/cus-ord-002/analysis',
    )
    expect(status).toBe(200)
    const a = payload.data
    expect(a.orderId).toBe('cus-ord-002')
    expect(a.verdict).toBe('RISKY')
    expect(Array.isArray(a.findings)).toBe(true)
    expect(a.findings.length).toBeGreaterThan(0)
  })

  it('returns 404 for order without analysis', async () => {
    const { status } = await call('GET', '/api/customer/orders/cus-ord-001/analysis')
    expect(status).toBe(404)
  })
})

describe('POST /api/customer/orders/:id/analysis/findings/:fid/apply', () => {
  it('marks finding suggestion as ACCEPTED', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-002/analysis/findings/finding-002-1/apply',
    )
    expect(status).toBe(200)
    const finding = payload.data.findings.find((f: any) => f.id === 'finding-002-1')
    expect(finding?.suggestionState).toBe('ACCEPTED')
  })
})

describe('POST /api/customer/orders/:id/analysis/findings/:fid/ignore', () => {
  it('marks finding suggestion as IGNORED', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-002/analysis/findings/finding-002-1/ignore',
    )
    expect(status).toBe(200)
    const finding = payload.data.findings.find((f: any) => f.id === 'finding-002-1')
    expect(finding?.suggestionState).toBe('IGNORED')
  })
})

describe('GET /api/customer/media', () => {
  it('returns media library with missions and assets', async () => {
    const { status, payload } = await call('GET', '/api/customer/media')
    expect(status).toBe(200)
    const lib = payload.data
    expect(Array.isArray(lib.missions)).toBe(true)
    expect(Array.isArray(lib.assets)).toBe(true)
    expect(lib.assets.length).toBeGreaterThan(0)
  })

  it('each asset has required fields', async () => {
    const { payload } = await call('GET', '/api/customer/media')
    const assets = payload.data.assets as Array<Record<string, unknown>>
    assets.forEach((a) => {
      expect(typeof a.id).toBe('string')
      expect(['PHOTO', 'VIDEO']).toContain(a.mediaType)
      expect(typeof a.fileSizeBytes).toBe('number')
    })
  })
})

describe('GET /api/customer/media/:id', () => {
  it('returns media detail for a known asset', async () => {
    const { status, payload } = await call('GET', '/api/customer/media/med-001')
    expect(status).toBe(200)
    const d = payload.data
    expect(d.asset.id).toBe('med-001')
    expect(d.downloadUrl).toBeTruthy()
    expect(d.nextMediaId).toBeTruthy()
    expect(d.prevMediaId).toBeNull()
  })

  it('returns 404 for unknown media id', async () => {
    const { status } = await call('GET', '/api/customer/media/no-such-id')
    expect(status).toBe(404)
  })
})
