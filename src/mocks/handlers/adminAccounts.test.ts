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
    expect(d.activeAccounts + d.pendingAccounts + d.inactiveAccounts).toBe(
      d.totalAccounts,
    )
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
    const sum = Object.values(d.byRole as Record<string, number>).reduce(
      (a, b) => a + b,
      0,
    )
    expect(sum).toBe(d.totalAccounts)
  })
})
