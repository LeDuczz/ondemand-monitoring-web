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

describe('PATCH /api/admin/catalog/stations/:id (toggle is_active)', () => {
  it('toggles is_active', async () => {
    const listRes = await call('GET', '/api/admin/catalog/stations')
    const sta = listRes.payload.data.items[0]
    const { status, payload } = await call('PATCH', `/api/admin/catalog/stations/${sta.id}`, { isActive: !sta.isActive })
    expect(status).toBe(200)
    expect(payload.data.isActive).toBe(!sta.isActive)
  })
})
