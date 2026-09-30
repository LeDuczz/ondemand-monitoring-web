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

describe('GET /api/admin/audit-log', () => {
  it('returns all entries', async () => {
    const { status, payload } = await call('GET', '/api/admin/audit-log')
    expect(status).toBe(200)
    expect(Array.isArray(payload.data.items)).toBe(true)
    expect(payload.data.total).toBe(12)
  })

  it('is sorted newest first', async () => {
    const { payload } = await call('GET', '/api/admin/audit-log?limit=20')
    const items: any[] = payload.data.items
    for (let i = 1; i < items.length; i++) {
      const prev = new Date(items[i - 1].createdAt).getTime()
      const curr = new Date(items[i].createdAt).getTime()
      expect(prev).toBeGreaterThanOrEqual(curr)
    }
  })

  it('paginates correctly', async () => {
    const page1 = await call('GET', '/api/admin/audit-log?page=1&limit=5')
    const page2 = await call('GET', '/api/admin/audit-log?page=2&limit=5')
    expect(page1.payload.data.items).toHaveLength(5)
    expect(page2.payload.data.items).toHaveLength(5)
    const ids1 = page1.payload.data.items.map((e: any) => e.id)
    const ids2 = page2.payload.data.items.map((e: any) => e.id)
    expect(ids1.some((id: string) => ids2.includes(id))).toBe(false)
  })

  it('filters by action', async () => {
    const { payload } = await call('GET', '/api/admin/audit-log?action=CREATE')
    const items: any[] = payload.data.items
    expect(items.every((e) => e.action === 'CREATE')).toBe(true)
    expect(items.length).toBeGreaterThan(0)
  })

  it('filters by entityType', async () => {
    const { payload } = await call('GET', '/api/admin/audit-log?entityType=account')
    const items: any[] = payload.data.items
    expect(items.every((e) => e.entityType === 'account')).toBe(true)
    expect(items.length).toBeGreaterThan(0)
  })

  it('entries have before/after or null', async () => {
    const { payload } = await call('GET', '/api/admin/audit-log?limit=20')
    for (const entry of payload.data.items as any[]) {
      expect(entry.before === null || typeof entry.before === 'object').toBe(true)
      expect(entry.after === null || typeof entry.after === 'object').toBe(true)
    }
  })
})
