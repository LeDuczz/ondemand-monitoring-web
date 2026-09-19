/* eslint-disable @typescript-eslint/no-explicit-any -- test helper reads
   arbitrary mock envelope payloads; a precise type isn't worth the noise. */
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

const validRequest = {
  scheduledStart: '2026-09-26T08:00:00+07:00',
  scheduledEnd: '2026-09-26T09:00:00+07:00',
  flightPlan: {
    planType: 'ORBIT',
    centerLat: 10.77,
    centerLon: 106.7,
    radiusM: 200,
    altitudeM: 60,
    speedMs: 8,
    estimatedDurationSec: 600,
    generatedBy: 'SYSTEM',
  },
  waypoints: [{ seq: 1, action: 'TAKEOFF', lat: 10.77, lon: 106.7, altM: 0 }],
}

beforeEach(() => {
  resetMockDb()
})
afterEach(() => {
  resetMockDb()
})

describe('POST /api/orders/{id}/missions', () => {
  it('404s for an unknown order', async () => {
    const { status } = await call(
      'POST',
      '/api/orders/nope/missions',
      validRequest,
    )
    expect(status).toBe(404)
  })

  it('409s ORDER_NOT_APPROVED for a PENDING order', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/orders/ord-2609-0157/missions',
      validRequest,
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('ORDER_NOT_APPROVED')
  })

  it('400s when altitude exceeds the no-fly ceiling', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/orders/ord-2609-0153/missions',
      {
        ...validRequest,
        flightPlan: { ...validRequest.flightPlan, altitudeM: 200 },
      },
    )
    expect(status).toBe(400)
    expect(payload.errors.altitudeM).toBeDefined()
  })

  it('422s FLIGHT_PLAN_GENERATION_FAILED when radiusM exceeds the failure limit', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/orders/ord-2609-0153/missions',
      {
        ...validRequest,
        flightPlan: { ...validRequest.flightPlan, radiusM: 900 },
      },
    )
    expect(status).toBe(422)
    expect(payload.code).toBe('FLIGHT_PLAN_GENERATION_FAILED')
  })

  it('attaches the plan to the bare CREATED mission from approve()', async () => {
    await call('POST', '/api/orders/ord-2609-0157/approve')
    const { status, payload } = await call(
      'POST',
      '/api/orders/ord-2609-0157/missions',
      validRequest,
    )
    expect(status).toBe(201)
    expect(payload.data.missionCode).toBe('MSN-2609-0157-1')
    expect(payload.data.flightPlan.planType).toBe('ORBIT')
  })

  it('starts a new attempt (…-2) when the order mission already has a plan', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/orders/ord-2609-0153/missions',
      validRequest,
    )
    expect(status).toBe(201)
    expect(payload.data.missionCode).toBe('MSN-2609-0153-2')
  })
})
