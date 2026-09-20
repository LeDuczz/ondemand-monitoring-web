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

describe('GET /api/customer/dashboard', () => {
  it('returns KPI counts matching the seed data', async () => {
    const { status, payload } = await call('GET', '/api/customer/dashboard')
    expect(status).toBe(200)
    const d = payload.data
    expect(d.pendingCount).toBe(1)
    expect(d.inProgressCount).toBe(1)
    expect(d.completedCount).toBe(1)
    expect(d.newMediaCount).toBe(1)
    expect(d.recentOrders).toHaveLength(5)
  })

  it('recent orders are sorted newest-first', async () => {
    const { payload } = await call('GET', '/api/customer/dashboard')
    const orders = payload.data.recentOrders as Array<{ submittedAt: string }>
    const dates = orders.map((o) => new Date(o.submittedAt).getTime())
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i])
    }
  })
})

describe('GET /api/customer/orders', () => {
  it('returns all 6 seeded orders with no filter', async () => {
    const { status, payload } = await call('GET', '/api/customer/orders')
    expect(status).toBe(200)
    expect(payload.data.items).toHaveLength(6)
  })

  it('filters by status=PENDING', async () => {
    const { status, payload } = await call('GET', '/api/customer/orders?status=PENDING')
    expect(status).toBe(200)
    const items = payload.data.items as Array<{ status: string }>
    expect(items.length).toBeGreaterThan(0)
    items.forEach((o) => expect(o.status).toBe('PENDING'))
  })

  it('filters by status=COMPLETED', async () => {
    const { payload } = await call('GET', '/api/customer/orders?status=COMPLETED')
    const items = payload.data.items as Array<{ status: string }>
    items.forEach((o) => expect(o.status).toBe('COMPLETED'))
  })

  it('returns items sorted newest-first', async () => {
    const { payload } = await call('GET', '/api/customer/orders')
    const items = payload.data.items as Array<{ submittedAt: string }>
    const dates = items.map((o) => new Date(o.submittedAt).getTime())
    for (let i = 1; i < dates.length; i++) {
      expect(dates[i - 1]).toBeGreaterThanOrEqual(dates[i])
    }
  })
})

describe('GET /api/customer/orders/:id', () => {
  it('returns full detail for a known id', async () => {
    const { status, payload } = await call('GET', '/api/customer/orders/cus-ord-001')
    expect(status).toBe(200)
    const d = payload.data
    expect(d.id).toBe('cus-ord-001')
    expect(d.orderCode).toBe('ORD-CUS-001')
    expect(d.status).toBe('PENDING')
    expect(Array.isArray(d.missions)).toBe(true)
  })

  it('returns full detail when looked up by orderCode', async () => {
    const { status, payload } = await call('GET', '/api/customer/orders/ORD-CUS-003')
    expect(status).toBe(200)
    expect(payload.data.id).toBe('cus-ord-003')
    expect(payload.data.missions).toHaveLength(2)
  })

  it('returns 404 for unknown id', async () => {
    const { status, payload } = await call('GET', '/api/customer/orders/no-such-id')
    expect(status).toBe(404)
    expect(payload.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/customer/orders', () => {
  it('creates a new PENDING order and returns its detail', async () => {
    const { status, payload } = await call('POST', '/api/customer/orders', {
      title: 'Test order từ test suite',
      preferredDate: '2026-10-01',
      serviceId: 'svc-survey',
      addressText: 'Quận 9, TP.HCM',
      centerLat: 10.8,
      centerLon: 106.8,
      radiusM: 300,
      preferredTimeName: 'Sáng 08:00–12:00',
      mediaItems: [],
    })
    expect(status).toBe(200)
    expect(payload.data.status).toBe('PENDING')
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
      serviceId: 'svc-agri',
      addressText: 'Long An',
      centerLat: 10.5,
      centerLon: 106.5,
      radiusM: 200,
      preferredTimeName: 'Sáng 08:00–12:00',
      mediaItems: [],
    })
    const { payload } = await call('GET', '/api/customer/orders')
    expect(payload.data.items).toHaveLength(7)
  })
})

describe('POST /api/customer/orders/:id/cancel', () => {
  it('cancels a PENDING order', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-001/cancel',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('CANCELLED')
  })

  it('cancels an APPROVED order', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-004/cancel',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('CANCELLED')
  })

  it('returns 409 for IN_PROGRESS order', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-002/cancel',
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('CANNOT_CANCEL')
  })

  it('returns 409 for COMPLETED order', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/customer/orders/cus-ord-003/cancel',
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('CANNOT_CANCEL')
  })

  it('returns 404 for unknown id', async () => {
    const { status } = await call('POST', '/api/customer/orders/no-such/cancel')
    expect(status).toBe(404)
  })
})
