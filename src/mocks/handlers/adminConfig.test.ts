/* eslint-disable @typescript-eslint/no-explicit-any */
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

describe('GET /api/admin/config/policies', () => {
  it('returns policies', async () => {
    const { status, payload } = await call('GET', '/api/admin/config/policies')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.items.length).toBe(8)
  })
})

describe('PATCH /api/admin/config/policies/:id', () => {
  it('updates policy value', async () => {
    const listRes = await call('GET', '/api/admin/config/policies')
    const policy = listRes.payload.data.items[0]
    const { status, payload } = await call('PATCH', `/api/admin/config/policies/${policy.id}`, { value: '48' })
    expect(status).toBe(200)
    expect(payload.data.value).toBe('48')
  })

  it('returns 404 for unknown', async () => {
    const { status } = await call('PATCH', '/api/admin/config/policies/nope', { value: '1' })
    expect(status).toBe(404)
  })
})

describe('GET /api/admin/config/weights', () => {
  it('returns weights', async () => {
    const { status, payload } = await call('GET', '/api/admin/config/weights')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.items.length).toBe(10)
  })

  it('drone weights sum to 100', async () => {
    const { payload } = await call('GET', '/api/admin/config/weights')
    const sum = (payload.data.items as any[]).filter((w) => w.group === 'DRONE').reduce((a: number, b: any) => a + b.value, 0)
    expect(sum).toBe(100)
  })
})

describe('PUT /api/admin/config/weights', () => {
  it('saves valid drone weights', async () => {
    const { status } = await call('PUT', '/api/admin/config/weights', {
      group: 'DRONE',
      weights: [
        { key: 'DRONE_DISTANCE', value: 20 },
        { key: 'DRONE_ENDURANCE', value: 30 },
        { key: 'DRONE_HEALTH', value: 20 },
        { key: 'DRONE_FITNESS', value: 20 },
        { key: 'DRONE_BALANCE', value: 10 },
      ],
    })
    expect(status).toBe(200)
  })

  it('returns 422 when sum != 100', async () => {
    const { status, payload } = await call('PUT', '/api/admin/config/weights', {
      group: 'DRONE',
      weights: [
        { key: 'DRONE_DISTANCE', value: 50 },
        { key: 'DRONE_ENDURANCE', value: 60 },
      ],
    })
    expect(status).toBe(422)
    expect(payload.code).toBe('WEIGHT_SUM_ERROR')
  })
})

describe('GET /api/admin/config/no-fly-zones', () => {
  it('returns no-fly zones', async () => {
    const { status, payload } = await call('GET', '/api/admin/config/no-fly-zones')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.items.length).toBe(4)
  })
})

describe('POST /api/admin/config/no-fly-zones', () => {
  it('creates a new zone', async () => {
    const { status, payload } = await call('POST', '/api/admin/config/no-fly-zones', {
      name: 'Test Zone',
      source: 'Test',
      zoneType: 'TEMPORARY',
      lat: 10.0,
      lon: 106.0,
      radiusM: 200,
      maxAltitudeM: 50,
      effectiveFrom: '2026-10-01',
    })
    expect(status).toBe(200)
    expect(payload.data.name).toBe('Test Zone')
    expect(payload.data.isActive).toBe(true)
  })

  it('returns 400 when name missing', async () => {
    const { status } = await call('POST', '/api/admin/config/no-fly-zones', { zoneType: 'TEMPORARY' })
    expect(status).toBe(400)
  })
})
