import { afterEach, describe, expect, it } from 'vitest'

import {
  ApiError,
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { resetMockDb } from '../../../mocks/db'
import { mockFetch } from '../../../mocks'
import { ordersApi } from './ordersApi'
import { missionsApi } from './missionsApi'
import type { CreateMissionRequest } from '../types/missions'

const validRequest: CreateMissionRequest = {
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

describe('missionsApi (mock mode)', () => {
  afterEach(() => {
    resetHttpTransport()
    resetMockDb()
  })

  it('createMission attaches a plan to the bare CREATED mission approve() makes', async () => {
    setHttpTransport(mockFetch)
    await ordersApi.approve('ord-2609-0157')
    const mission = await missionsApi.createMission(
      'ord-2609-0157',
      validRequest,
    )
    expect(mission.missionCode).toBe('MSN-2609-0157-1')
    expect(mission.flightPlan?.planType).toBe('ORBIT')
    expect(mission.scheduledStartAt).toBe(validRequest.scheduledStart)
  })

  it('createMission starts a new attempt when the mission already has a plan', async () => {
    // msn-2609-0153-1 is seeded with a flight plan already attached (the
    // MNG-05 default-state demo mission) — a second createMission call for
    // the same order must not overwrite it.
    setHttpTransport(mockFetch)
    const mission = await missionsApi.createMission(
      'ord-2609-0153',
      validRequest,
    )
    expect(mission.missionCode).toBe('MSN-2609-0153-2')
  })

  it('createMission 409s for a non-APPROVED order', async () => {
    setHttpTransport(mockFetch)
    await expect(
      missionsApi.createMission('ord-2609-0160', validRequest),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('getMission resolves the seeded demo mission', async () => {
    setHttpTransport(mockFetch)
    const mission = await missionsApi.getMission('msn-2609-0153-1')
    expect(mission.orderCode).toBe('ORD-2609-0153')
    expect(mission.nearestBase).toBe('Trạm Nhà Bè')
  })

  it('getMission 404s for an unknown id', async () => {
    setHttpTransport(mockFetch)
    await expect(
      missionsApi.getMission('does-not-exist'),
    ).rejects.toMatchObject({ status: 404 })
  })

  it('getResourceSuggestions resolves the default feasible scenario', async () => {
    setHttpTransport(mockFetch)
    const suggestions =
      await missionsApi.getResourceSuggestions('msn-2609-0153-1')
    expect(suggestions.feasible).toBe(true)
    expect(suggestions.topDrones).toHaveLength(3)
    expect(suggestions.topDrones[0].code).toBe('DRN-01')
  })

  it('getResourceSuggestions resolves the insufficient scenario via query flag', async () => {
    setHttpTransport(mockFetch)
    const suggestions = await missionsApi.getResourceSuggestions(
      'msn-2609-0153-1',
      { scenario: 'insufficient' },
    )
    expect(suggestions.feasible).toBe(false)
    expect(suggestions.alternatives).toHaveLength(3)
  })

  it('assignDrone assigns and moves the mission to RESOURCE_ASSIGNING', async () => {
    setHttpTransport(mockFetch)
    const mission = await missionsApi.assignDrone('msn-2609-0153-1', 'DRN-01')
    expect(mission.status).toBe('RESOURCE_ASSIGNING')
    expect(mission.droneId).toBe('drn-01')
  })

  it('assignDrone 409s SCHEDULE_CONFLICT for DRN-04 against the seeded booking', async () => {
    setHttpTransport(mockFetch)
    try {
      await missionsApi.assignDrone('msn-2609-0153-1', 'DRN-04')
      throw new Error('expected rejection')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(409)
      expect((err as ApiError).code).toBe('SCHEDULE_CONFLICT')
    }
  })
})
