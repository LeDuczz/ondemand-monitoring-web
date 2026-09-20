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

describe('GET /api/admin/catalog/services', () => {
  it('returns services list', async () => {
    const { status, payload } = await call('GET', '/api/admin/catalog/services')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.items.length).toBeGreaterThan(0)
  })

  it('each service has sensors array', async () => {
    const { payload } = await call('GET', '/api/admin/catalog/services')
    for (const svc of payload.data.items as any[]) {
      expect(Array.isArray(svc.sensors)).toBe(true)
    }
  })
})

describe('PATCH /api/admin/catalog/services/:id', () => {
  it('updates service name', async () => {
    const listRes = await call('GET', '/api/admin/catalog/services')
    const id = listRes.payload.data.items[0].id
    const { status, payload } = await call('PATCH', `/api/admin/catalog/services/${id}`, { name: 'Ten Moi' })
    expect(status).toBe(200)
    expect(payload.data.name).toBe('Ten Moi')
  })

  it('returns 404 for unknown id', async () => {
    const { status } = await call('PATCH', '/api/admin/catalog/services/nope', { name: 'X' })
    expect(status).toBe(404)
  })
})

describe('GET /api/admin/catalog/timeslots', () => {
  it('returns timeslots', async () => {
    const { status, payload } = await call('GET', '/api/admin/catalog/timeslots')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.items.length).toBeGreaterThan(0)
  })
})

describe('POST /api/admin/catalog/timeslots', () => {
  it('creates a new timeslot version', async () => {
    const { status, payload } = await call('POST', '/api/admin/catalog/timeslots', {
      code: 'EVENING',
      name: 'Khung toi',
      startTime: '18:00',
      endTime: '21:00',
      effectiveFrom: '2026-10-01',
    })
    expect(status).toBe(200)
    expect(payload.data.code).toBe('EVENING')
    expect(payload.data.effectiveTo).toBeNull()
  })

  it('closes previous version for same code', async () => {
    await call('POST', '/api/admin/catalog/timeslots', {
      code: 'MORNING',
      name: 'Khung sang moi',
      startTime: '07:00',
      endTime: '12:00',
      effectiveFrom: '2027-01-01',
    })
    const { payload } = await call('GET', '/api/admin/catalog/timeslots')
    const morning = (payload.data.items as any[]).filter((t) => t.code === 'MORNING' && t.effectiveTo !== null)
    expect(morning.length).toBeGreaterThan(0)
  })
})

describe('GET /api/admin/catalog/stations', () => {
  it('returns stations', async () => {
    const { status, payload } = await call('GET', '/api/admin/catalog/stations')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.items.length).toBeGreaterThan(0)
  })
})

describe('POST /api/admin/catalog/stations', () => {
  it('creates a new station', async () => {
    const { status, payload } = await call('POST', '/api/admin/catalog/stations', {
      code: 'STA_TEST',
      name: 'Tram Test',
      address: '123 ABC',
      lat: 10.0,
      lon: 106.0,
      maxServiceRadiusM: 7000,
    })
    expect(status).toBe(200)
    expect(payload.data.code).toBe('STA_TEST')
  })

  it('returns 409 on duplicate code', async () => {
    await call('POST', '/api/admin/catalog/stations', { code: 'DUP_STA', name: 'Dup', address: '', lat: 0, lon: 0, maxServiceRadiusM: 1000 })
    const { status } = await call('POST', '/api/admin/catalog/stations', { code: 'DUP_STA', name: 'Dup2', address: '', lat: 0, lon: 0, maxServiceRadiusM: 1000 })
    expect(status).toBe(409)
  })
})
