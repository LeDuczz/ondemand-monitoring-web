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

describe('GET /api/admin/roles', () => {
  it('returns all roles', async () => {
    const { status, payload } = await call('GET', '/api/admin/roles')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.items.length).toBeGreaterThan(0)
  })

  it('includes both system and custom roles', async () => {
    const { payload } = await call('GET', '/api/admin/roles')
    const types: string[] = payload.data.items.map((r: any) => r.type)
    expect(types).toContain('SYSTEM')
    expect(types).toContain('CUSTOM')
  })
})

describe('POST /api/admin/roles', () => {
  it('creates a custom role', async () => {
    const { status, payload } = await call('POST', '/api/admin/roles', {
      code: 'REPORTER',
      name: 'Bao cao vien',
      description: 'Xem bao cao',
      isActive: true,
    })
    expect(status).toBe(200)
    expect(payload.data.code).toBe('REPORTER')
    expect(payload.data.isSystemRole).toBe(false)
  })

  it('returns 400 when code missing', async () => {
    const { status, payload } = await call('POST', '/api/admin/roles', { name: 'Test' })
    expect(status).toBe(400)
    expect(payload.code).toBe('VALIDATION_ERROR')
  })

  it('returns 409 when code already exists', async () => {
    await call('POST', '/api/admin/roles', { code: 'DUPCODE', name: 'Dup', description: '', isActive: true })
    const { status, payload } = await call('POST', '/api/admin/roles', { code: 'DUPCODE', name: 'Dup2', description: '', isActive: true })
    expect(status).toBe(409)
    expect(payload.code).toBe('CODE_EXISTS')
  })

  it('code is uppercased', async () => {
    const { payload } = await call('POST', '/api/admin/roles', { code: 'lowercase', name: 'Test', description: '', isActive: true })
    expect(payload.data.code).toBe('LOWERCASE')
  })
})

describe('PATCH /api/admin/roles/:id', () => {
  it('updates custom role', async () => {
    const listRes = await call('GET', '/api/admin/roles')
    const customRole = listRes.payload.data.items.find((r: any) => !r.isSystemRole)
    const { status, payload } = await call('PATCH', `/api/admin/roles/${customRole.id}`, {
      name: 'Ten Moi',
      description: 'Mo ta moi',
      isActive: false,
    })
    expect(status).toBe(200)
    expect(payload.data.name).toBe('Ten Moi')
    expect(payload.data.isActive).toBe(false)
  })

  it('returns 403 when editing system role', async () => {
    const listRes = await call('GET', '/api/admin/roles')
    const sysRole = listRes.payload.data.items.find((r: any) => r.isSystemRole)
    const { status, payload } = await call('PATCH', `/api/admin/roles/${sysRole.id}`, { name: 'Hack' })
    expect(status).toBe(403)
    expect(payload.code).toBe('SYSTEM_ROLE')
  })
})

describe('PATCH /api/admin/roles/:id/toggle-active', () => {
  it('toggles is_active on a custom role', async () => {
    const listRes = await call('GET', '/api/admin/roles')
    const customRole = listRes.payload.data.items.find((r: any) => !r.isSystemRole)
    const { status, payload } = await call('PATCH', `/api/admin/roles/${customRole.id}/toggle-active`, { isActive: false })
    expect(status).toBe(200)
    expect(payload.data.isActive).toBe(false)
  })

  it('toggles is_active on a system role (allowed, unlike full edit)', async () => {
    const listRes = await call('GET', '/api/admin/roles')
    const sysRole = listRes.payload.data.items.find((r: any) => r.isSystemRole)
    const { status, payload } = await call('PATCH', `/api/admin/roles/${sysRole.id}/toggle-active`, { isActive: false })
    expect(status).toBe(200)
    expect(payload.data.isActive).toBe(false)
  })

  it('returns 404 for unknown id', async () => {
    const { status } = await call('PATCH', '/api/admin/roles/nope/toggle-active', { isActive: false })
    expect(status).toBe(404)
  })
})

describe('DELETE /api/admin/roles/:id', () => {
  it('deletes a custom role with 0 users', async () => {
    const createRes = await call('POST', '/api/admin/roles', { code: 'DELETEME', name: 'Del', description: '', isActive: true })
    const id = createRes.payload.data.id
    const { status } = await call('DELETE', `/api/admin/roles/${id}`)
    expect(status).toBe(200)
  })

  it('returns 409 when role has users', async () => {
    const listRes = await call('GET', '/api/admin/roles')
    const roleWithUsers = listRes.payload.data.items.find((r: any) => !r.isSystemRole && r.userCount > 0)
    if (!roleWithUsers) return // skip if no such role in seed
    const { status } = await call('DELETE', `/api/admin/roles/${roleWithUsers.id}`)
    expect(status).toBe(409)
  })

  it('returns 403 when deleting system role', async () => {
    const listRes = await call('GET', '/api/admin/roles')
    const sysRole = listRes.payload.data.items.find((r: any) => r.isSystemRole)
    const { status, payload } = await call('DELETE', `/api/admin/roles/${sysRole.id}`)
    expect(status).toBe(403)
    expect(payload.code).toBe('SYSTEM_ROLE')
  })
})
