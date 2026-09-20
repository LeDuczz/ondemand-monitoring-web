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

describe('GET /api/admin/dashboard', () => {
  it('returns KPI counts', async () => {
    const { status, payload } = await call('GET', '/api/admin/dashboard')
    expect(status).toBe(200)
    const d = payload.data
    expect(typeof d.totalAccounts).toBe('number')
    expect(d.totalAccounts).toBeGreaterThan(0)
    expect(d.activeAccounts + d.pendingAccounts + d.inactiveAccounts).toBe(d.totalAccounts)
  })

  it('recentAccounts is sorted newest first', async () => {
    const { payload } = await call('GET', '/api/admin/dashboard')
    const recent: any[] = payload.data.recentAccounts
    for (let i = 1; i < recent.length; i++) {
      const prev = new Date(recent[i - 1].createdAt).getTime()
      const curr = new Date(recent[i].createdAt).getTime()
      expect(prev).toBeGreaterThanOrEqual(curr)
    }
  })

  it('byRole sums to totalAccounts', async () => {
    const { payload } = await call('GET', '/api/admin/dashboard')
    const d = payload.data
    const sum = Object.values(d.byRole as Record<string, number>).reduce((a, b) => a + b, 0)
    expect(sum).toBe(d.totalAccounts)
  })
})

describe('GET /api/admin/accounts', () => {
  it('returns all accounts', async () => {
    const { status, payload } = await call('GET', '/api/admin/accounts')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.items.length).toBeGreaterThan(0)
  })

  it('filters by role', async () => {
    const { payload } = await call('GET', '/api/admin/accounts?role=STAFF')
    const items: any[] = payload.data.items
    expect(items.every((a) => a.role === 'STAFF')).toBe(true)
  })

  it('filters by status INACTIVE', async () => {
    const { payload } = await call('GET', '/api/admin/accounts?status=INACTIVE')
    const items: any[] = payload.data.items
    expect(items.every((a) => a.status === 'INACTIVE')).toBe(true)
    expect(items.length).toBeGreaterThan(0)
  })

  it('returns empty items when no match', async () => {
    const { status, payload } = await call('GET', '/api/admin/accounts?role=ADMIN&status=INACTIVE')
    expect(status).toBe(200)
    expect(payload.data.items).toHaveLength(0)
  })

  it('items sorted newest createdAt first', async () => {
    const { payload } = await call('GET', '/api/admin/accounts')
    const items: any[] = payload.data.items
    for (let i = 1; i < items.length; i++) {
      expect(new Date(items[i - 1].createdAt).getTime()).toBeGreaterThanOrEqual(
        new Date(items[i].createdAt).getTime(),
      )
    }
  })
})

describe('GET /api/admin/accounts/:id', () => {
  it('returns detail for existing account', async () => {
    const listRes = await call('GET', '/api/admin/accounts')
    const id = listRes.payload.data.items[0].id
    const { status, payload } = await call('GET', `/api/admin/accounts/${id}`)
    expect(status).toBe(200)
    expect(payload.data.id).toBe(id)
    expect(Array.isArray(payload.data.linkedProviders)).toBe(true)
  })

  it('returns 404 for unknown id', async () => {
    const { status, payload } = await call('GET', '/api/admin/accounts/unknown-xyz')
    expect(status).toBe(404)
    expect(payload.code).toBe('NOT_FOUND')
  })
})

describe('POST /api/admin/accounts', () => {
  it('creates a new account', async () => {
    const { status, payload } = await call('POST', '/api/admin/accounts', {
      fullName: 'Nhân viên Mới',
      email: 'newstaff@test.vn',
      role: 'STAFF',
    })
    expect(status).toBe(200)
    expect(payload.data.email).toBe('newstaff@test.vn')
    expect(payload.data.status).toBe('PENDING')
    expect(payload.data.emailVerified).toBe(false)
  })

  it('returns 400 when fullName is missing', async () => {
    const { status, payload } = await call('POST', '/api/admin/accounts', {
      email: 'x@y.vn',
      role: 'STAFF',
    })
    expect(status).toBe(400)
    expect(payload.code).toBe('VALIDATION_ERROR')
  })

  it('returns 400 when email is missing', async () => {
    const { status, payload } = await call('POST', '/api/admin/accounts', {
      fullName: 'A',
      role: 'STAFF',
    })
    expect(status).toBe(400)
    expect(payload.code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 when email already exists', async () => {
    const listRes = await call('GET', '/api/admin/accounts')
    const existing = listRes.payload.data.items[0]
    const { status, payload } = await call('POST', '/api/admin/accounts', {
      fullName: 'Duplicate',
      email: existing.email,
      role: 'STAFF',
    })
    expect(status).toBe(409)
    expect(payload.code).toBe('EMAIL_EXISTS')
  })

  it('new account appears in list', async () => {
    await call('POST', '/api/admin/accounts', {
      fullName: 'Kiểm tra',
      email: 'check@test.vn',
      role: 'DRONE_OPERATOR',
    })
    const { payload } = await call('GET', '/api/admin/accounts')
    const found = payload.data.items.find((a: any) => a.email === 'check@test.vn')
    expect(found).toBeDefined()
    expect(found.role).toBe('DRONE_OPERATOR')
  })
})

describe('PATCH /api/admin/accounts/:id', () => {
  it('updates fullName', async () => {
    const listRes = await call('GET', '/api/admin/accounts')
    const id = listRes.payload.data.items[0].id
    const { status, payload } = await call('PATCH', `/api/admin/accounts/${id}`, {
      fullName: 'Tên Mới Nhất',
    })
    expect(status).toBe(200)
    expect(payload.data.fullName).toBe('Tên Mới Nhất')
  })

  it('updates role', async () => {
    const listRes = await call('GET', '/api/admin/accounts?role=STAFF')
    const id = listRes.payload.data.items[0].id
    const { status, payload } = await call('PATCH', `/api/admin/accounts/${id}`, {
      role: 'DRONE_OPERATOR',
    })
    expect(status).toBe(200)
    expect(payload.data.role).toBe('DRONE_OPERATOR')
  })

  it('returns 404 for unknown id', async () => {
    const { status } = await call('PATCH', '/api/admin/accounts/nope', { fullName: 'X' })
    expect(status).toBe(404)
  })
})

describe('POST /api/admin/accounts/:id/deactivate', () => {
  it('deactivates an ACTIVE account', async () => {
    const listRes = await call('GET', '/api/admin/accounts?status=ACTIVE')
    const id = listRes.payload.data.items[0].id
    const { status, payload } = await call('POST', `/api/admin/accounts/${id}/deactivate`)
    expect(status).toBe(200)
    expect(payload.data.status).toBe('INACTIVE')
  })

  it('returns 409 when already INACTIVE', async () => {
    const listRes = await call('GET', '/api/admin/accounts?status=INACTIVE')
    const id = listRes.payload.data.items[0].id
    const { status, payload } = await call('POST', `/api/admin/accounts/${id}/deactivate`)
    expect(status).toBe(409)
    expect(payload.code).toBe('ALREADY_INACTIVE')
  })

  it('returns 404 for unknown id', async () => {
    const { status } = await call('POST', '/api/admin/accounts/nope/deactivate')
    expect(status).toBe(404)
  })
})

describe('POST /api/admin/accounts/:id/activate', () => {
  it('activates an INACTIVE account', async () => {
    const listRes = await call('GET', '/api/admin/accounts?status=INACTIVE')
    const id = listRes.payload.data.items[0].id
    const { status, payload } = await call('POST', `/api/admin/accounts/${id}/activate`)
    expect(status).toBe(200)
    expect(payload.data.status).toBe('ACTIVE')
  })

  it('returns 409 when already ACTIVE', async () => {
    const listRes = await call('GET', '/api/admin/accounts?status=ACTIVE')
    const id = listRes.payload.data.items[0].id
    const { status, payload } = await call('POST', `/api/admin/accounts/${id}/activate`)
    expect(status).toBe(409)
    expect(payload.code).toBe('ALREADY_ACTIVE')
  })

  it('returns 404 for unknown id', async () => {
    const { status } = await call('POST', '/api/admin/accounts/nope/activate')
    expect(status).toBe(404)
  })
})
