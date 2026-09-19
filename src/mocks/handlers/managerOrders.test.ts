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

describe('GET /api/orders/{id}', () => {
  it('404s for an unknown id', async () => {
    const { status, payload } = await call('GET', '/api/orders/nope')
    expect(status).toBe(404)
    expect(payload.code).toBe('NOT_FOUND')
  })

  it('returns full detail for a PENDING order', async () => {
    const { status, payload } = await call('GET', '/api/orders/ord-2609-0157')
    expect(status).toBe(200)
    expect(payload.data.code).toBe('ORD-2609-0157')
    expect(payload.data.addressText).toContain('Cát Lái')
  })
})

describe('GET /api/orders/{id}/analysis/latest', () => {
  it('returns design findings for ORD-2609-0157 (FEASIBLE)', async () => {
    const { payload } = await call(
      'GET',
      '/api/orders/ord-2609-0157/analysis/latest',
    )
    expect(payload.data.overallVerdict).toBe('FEASIBLE')
    expect(payload.data.findings).toHaveLength(2)
  })

  it('returns design findings for ORD-2609-0160 (RISKY)', async () => {
    const { payload } = await call(
      'GET',
      '/api/orders/ord-2609-0160/analysis/latest',
    )
    expect(payload.data.overallVerdict).toBe('RISKY')
    expect(payload.data.warningCount).toBe(2)
    expect(payload.data.findings).toHaveLength(2)
  })

  it('falls back to the queue verdict/counts with empty findings for other orders', async () => {
    const { payload } = await call(
      'GET',
      '/api/orders/ord-2609-0161/analysis/latest',
    )
    expect(payload.data.overallVerdict).toBe('RISKY')
    expect(payload.data.findings).toEqual([])
  })
})
