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

describe('POST /api/maintenance-tickets', () => {
  it('400s when title is missing', async () => {
    const { status } = await call('POST', '/api/maintenance-tickets', {
      droneId: 'drn-01',
    })
    expect(status).toBe(400)
  })

  it('400s when droneId is missing', async () => {
    const { status } = await call('POST', '/api/maintenance-tickets', {
      title: 'Test',
    })
    expect(status).toBe(400)
  })

  it('creates a ticket with OPEN status', async () => {
    const { status, payload } = await call('POST', '/api/maintenance-tickets', {
      droneId: 'drn-01',
      title: 'Test ticket',
      priority: 'HIGH',
    })
    expect(status).toBe(201)
    expect(payload.data.status).toBe('OPEN')
    expect(payload.data.title).toBe('Test ticket')
  })
})

describe('PATCH /api/maintenance-tickets/:id/status', () => {
  it('404s for unknown ticket', async () => {
    const { status } = await call(
      'PATCH',
      '/api/maintenance-tickets/nope/status',
      { status: 'IN_PROGRESS' },
    )
    expect(status).toBe(404)
  })

  it('422s on invalid transition (CLOSED → anything)', async () => {
    const { status } = await call(
      'PATCH',
      '/api/maintenance-tickets/mt-2609-008/status',
      { status: 'OPEN' },
    )
    expect(status).toBe(422)
  })

  it('transitions OPEN → IN_PROGRESS', async () => {
    const { status, payload } = await call(
      'PATCH',
      '/api/maintenance-tickets/mt-2609-011/status',
      { status: 'IN_PROGRESS' },
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('IN_PROGRESS')
  })

  it('sets resolvedAt when moving to RESOLVED', async () => {
    // First transition to IN_PROGRESS
    await call('PATCH', '/api/maintenance-tickets/mt-2609-011/status', {
      status: 'IN_PROGRESS',
    })
    const { payload } = await call(
      'PATCH',
      '/api/maintenance-tickets/mt-2609-011/status',
      { status: 'RESOLVED' },
    )
    expect(payload.data.resolvedAt).toBeTruthy()
  })
})
