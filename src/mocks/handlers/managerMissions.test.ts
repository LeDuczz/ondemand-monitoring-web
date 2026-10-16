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

beforeEach(() => {
  resetMockDb()
})
afterEach(() => {
  resetMockDb()
})

describe('GET /api/missions/{id}/resource-suggestions', () => {
  it('returns the feasible default scenario with 3 ranked drones/operators', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/missions/msn-2609-0153-1/resource-suggestions',
    )
    expect(status).toBe(200)
    expect(payload.data.feasible).toBe(true)
    expect(payload.data.topDrones).toHaveLength(3)
    expect(payload.data.topDrones[0]).toMatchObject({
      code: 'DRN-01',
      score: 91,
    })
    expect(payload.data.topOperators[0]).toMatchObject({
      code: 'HT',
      score: 88,
    })
    expect(payload.data.rejected.drones).toHaveLength(6)
    expect(payload.data.rejected.operators).toHaveLength(3)
  })

  it('returns the insufficient scenario with alternatives via ?scenario=insufficient', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/missions/msn-2609-0153-1/resource-suggestions?scenario=insufficient',
    )
    expect(status).toBe(200)
    expect(payload.data.feasible).toBe(false)
    expect(payload.data.topDrones).toHaveLength(0)
    expect(payload.data.alternatives).toHaveLength(3)
  })
})

describe('POST /api/missions/{id}/assign-drone', () => {
  it('assigns and moves the mission to RESOURCE_ASSIGNING', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assign-drone?droneId=DRN-01',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('RESOURCE_ASSIGNING')
    expect(payload.data.droneId).toBe('drn-01')
  })

  it('409s SCHEDULE_CONFLICT for DRN-04 against MSN-2609-0150-1', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assign-drone?droneId=DRN-04',
    )
    expect(status).toBe(409)
    expect(payload.code).toBe('SCHEDULE_CONFLICT')
    expect(payload.message).toContain('MSN-2609-0150-1')
  })

  it('400s when droneId is missing', async () => {
    const { status } = await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assign-drone',
    )
    expect(status).toBe(400)
  })

  it('404s for an unknown drone', async () => {
    const { status } = await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assign-drone?droneId=DRN-99',
    )
    expect(status).toBe(404)
  })
})

describe('POST /api/missions/{id}/assign-operator', () => {
  it('assigns and, after a drone is already set, reaches WAITING_OPERATOR_ACCEPTANCE', async () => {
    await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assign-drone?droneId=DRN-01',
    )
    const { status, payload } = await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assign-operator?operatorId=HT',
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('WAITING_OPERATOR_ACCEPTANCE')
  })

  it('400s when operatorId is missing', async () => {
    const { status } = await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assign-operator',
    )
    expect(status).toBe(400)
  })

  it('404s for an unknown operator', async () => {
    const { status } = await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assign-operator?operatorId=ZZ',
    )
    expect(status).toBe(404)
  })
})

describe('POST /api/missions/{id}/assignments/{aid}/release', () => {
  it('400s when releaseReason is blank', async () => {
    await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assign-drone?droneId=DRN-01',
    )
    const { status, payload } = await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assignments/mda-msn-2609-0153-1-drn-01/release',
      { releaseReason: '' },
    )
    expect(status).toBe(400)
    expect(payload.errors.releaseReason).toBeDefined()
  })

  it('releases the drone assignment and returns the mission to CREATED', async () => {
    await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assign-drone?droneId=DRN-01',
    )
    const { status, payload } = await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assignments/mda-msn-2609-0153-1-drn-01/release',
      { releaseReason: 'Drone bị gọi bảo trì khẩn' },
    )
    expect(status).toBe(200)
    expect(payload.data.status).toBe('CREATED')
    expect(payload.data.droneId).toBeNull()
  })

  it('404s for an assignment id that does not belong to the mission', async () => {
    const { status } = await call(
      'POST',
      '/api/missions/msn-2609-0153-1/assignments/not-a-real-id/release',
      { releaseReason: 'x' },
    )
    expect(status).toBe(404)
  })
})

describe('PATCH /api/missions/{id}/schedule', () => {
  it('400s when body is missing', async () => {
    const { status } = await call(
      'PATCH',
      '/api/missions/msn-2609-0142-1/schedule',
      {},
    )
    expect(status).toBe(400)
  })

  it('404s for an unknown mission', async () => {
    const { status } = await call('PATCH', '/api/missions/nope/schedule', {
      scheduledStart: '2026-09-25T10:00:00+07:00',
      scheduledEnd: '2026-09-25T11:00:00+07:00',
    })
    expect(status).toBe(404)
  })

  it('updates the schedule and returns the mission', async () => {
    const { status, payload } = await call(
      'PATCH',
      '/api/missions/msn-2609-0153-1/schedule',
      {
        scheduledStart: '2026-09-26T10:00:00+07:00',
        scheduledEnd: '2026-09-26T11:30:00+07:00',
      },
    )
    expect(status).toBe(200)
    expect(payload.data.scheduledStartAt).toBe('2026-09-26T10:00:00+07:00')
  })
})

describe('GET /api/missions/{id}/live', () => {
  it('returns telemetry for MSN-2609-0142-1', async () => {
    const { status, payload } = await call(
      'GET',
      '/api/missions/msn-2609-0142-1/live',
    )
    expect(status).toBe(200)
    expect(payload.data.missionStatus).toBe('IN_FLIGHT')
    expect(payload.data.batteryPct).toBe(71)
    expect(payload.data.altitudeM).toBe(68)
    expect(payload.data.livestream.isLive).toBe(true)
  })

  it('404s for unknown mission', async () => {
    const { status } = await call('GET', '/api/missions/nope/live')
    expect(status).toBe(404)
  })
})

describe('POST /api/missions/{id}/incidents', () => {
  it('400s when description is missing', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/missions/msn-2609-0142-1/incidents',
      { type: 'WIND' },
    )
    expect(status).toBe(400)
    expect(payload.errors.description).toBeDefined()
  })

  it('creates an incident and it appears in live feed', async () => {
    const { status, payload } = await call(
      'POST',
      '/api/missions/msn-2609-0142-1/incidents',
      { type: 'WIND', description: 'Gió mạnh hướng đông' },
    )
    expect(status).toBe(201)
    expect(payload.data.type).toBe('WIND')

    const { payload: livePayload } = await call(
      'GET',
      '/api/missions/msn-2609-0142-1/live',
    )
    expect(livePayload.data.activeIncidents).toHaveLength(1)
  })
})
