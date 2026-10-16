/* eslint-disable @typescript-eslint/no-explicit-any -- test helper reads
   arbitrary mock envelope payloads; a precise type isn't worth the noise. */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import './managerOrders'

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

beforeEach(() => {
  resetMockDb()
})
afterEach(() => {
  resetMockDb()
})

describe('GET /api/orders?status=PENDING', () => {
  it('returns the 6 seeded PENDING rows, FEASIBLE=3 / RISKY=3 / INFEASIBLE=0', async () => {
    const { status, payload } = await call('GET', '/api/orders?status=PENDING')
    expect(status).toBe(200)
    expect(payload.data).toHaveLength(6)
    const byVerdict = payload.data.reduce(
      (acc: Record<string, number>, r: any) => {
        acc[r.aiVerdict] = (acc[r.aiVerdict] ?? 0) + 1
        return acc
      },
      {},
    )
    expect(byVerdict).toEqual({ FEASIBLE: 3, RISKY: 3 })
  })
})

describe('resource-preview and internal-note', () => {

  it('PUT internal-note upserts and returns the note', async () => {
    const { status, payload } = await call(
      'PUT',
      '/api/orders/ord-2609-0157/internal-note',
      {
        note: 'Ghi chú test',
      },
    )
    expect(status).toBe(200)
    expect(payload.data.note).toBe('Ghi chú test')
    expect(payload.data.authorName).toBe('Lê Thị Thanh Hằng')
  })
})

describe('GET /api/orders/{id}/mission-brief', () => {
  it('resolves the seeded APPROVED order for CreateMissionPage', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/orders/ord-2609-0153/mission-brief',
    )
    expect(status).toBe(200)
    expect(payload.data.serviceName).toBe(
      'Kiểm tra nhiệt mái nhà xưởng KCN Hiệp Phước',
    )
    expect(payload.data.customerFullName).toBe('Trần Thị Thu Hà')
    expect(payload.data.radiusM).toBe(300)
  })

  it('409s for a PENDING order', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/orders/ord-2609-0157/mission-brief',
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('ORDER_NOT_APPROVED')
  })

  it('404s for an unknown order', async () => {
    const { status } = await call('GET', '/api/orders/nope/mission-brief')
    expect(status).toBe(404)
  })
})
