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
})
