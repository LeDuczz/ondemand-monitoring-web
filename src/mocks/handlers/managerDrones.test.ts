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

describe('GET /api/drones', () => {
  it('returns all drones', async () => {
    const { status, payload } = await call('GET', '/api/drones')
    expect(status).toBe(200)
    expect(payload.data.items.length).toBeGreaterThan(0)
    expect(payload.data.totalItems).toBe(payload.data.items.length)
  })

  it('filters by status', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/drones?status=AVAILABLE',
    )
    expect(status).toBe(200)
    for (const item of payload.data.items) {
      expect(item.status).toBe('AVAILABLE')
    }
  })

  it('returns empty list for unknown status', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/drones?status=UNKNOWN_STATUS',
    )
    expect(status).toBe(200)
    expect(payload.data.items).toHaveLength(0)
    expect(payload.data.totalItems).toBe(0)
  })

  it('paginates results', async () => {
    const { payload } = await call('GET', '/api/drones?page=1&pageSize=3')
    expect(payload.data.items.length).toBeLessThanOrEqual(3)
    expect(payload.data.page).toBe(1)
    expect(payload.data.size).toBe(3)
  })
})

describe('PATCH /api/drones/:id/status', () => {
  it('404s for unknown drone', async () => {
    const { status } = await call('PATCH', '/api/drones/nope/status', {
      status: 'MAINTENANCE',
      reason: 'Test',
    })
    expect(status).toBe(404)
  })

  it('400s when reason is empty', async () => {
    const { status, payload } = await call(
      'PATCH',
      '/api/drones/drn-01/status',
      {
        status: 'MAINTENANCE',
        reason: '',
      },
    )
    expect(status).toBe(400)
    expect(payload.errors?.reason).toBeTruthy()
  })

  it('422s on invalid transition', async () => {
    // DRN-02 is IN_MISSION; cannot go to AVAILABLE directly
    const { status } = await call('PATCH', '/api/drones/drn-02/status', {
      status: 'AVAILABLE',
      reason: 'Test',
    })
    expect(status).toBe(422)
  })

  it('updates drone status on valid transition', async () => {
    // DRN-01 is AVAILABLE → MAINTENANCE is valid
    const { status, payload } = await call(
      'PATCH',
      '/api/drones/drn-01/status',
      {
        status: 'MAINTENANCE',
        reason: 'Scheduled check',
      },
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('MAINTENANCE')
  })

  it('persists the change for subsequent reads', async () => {
    await call('PATCH', '/api/drones/drn-01/status', {
      status: 'MAINTENANCE',
      reason: 'Test',
    })
    const { payload } = await call('GET', '/api/drones?status=MAINTENANCE')
    const serials = payload.data.items.map((d: any) => d.serialNumber)
    expect(serials).toContain('1ZNBJ4K00C3A21')
  })
})
