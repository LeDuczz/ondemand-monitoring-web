import { afterEach, describe, expect, it } from 'vitest'

import {
  ApiError,
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { stubApi, stubError } from '../../../test/stubApi'
import { resetMockDb } from '../../../mocks/db'
import { mockFetch } from '../../../mocks'
import { missionsApi, toMissionCalendarItem } from './missionsApi'
import type { MissionResponse } from '../types/missions'
import type { CreateMissionRequest } from '../types/missions'

const validRequest: CreateMissionRequest = {
  idempotencyKey: '183e3666-ad90-4085-b1c6-ff6858f769d1',
  expectedPlanRevision: 0,
  scopeLabel: 'Whole Order scope',
  scheduledStart: '2026-09-26T08:00:00+07:00',
  scheduledEnd: '2026-09-26T09:00:00+07:00',
}

describe('Staff mission response mapping', () => {
  it('keeps unavailable schedule and assignment details unknown', () => {
    const item = toMissionCalendarItem({
      id: 'mission-1',
      orderId: 'order-1',
      orderTitle: 'Survey',
      missionCode: 'MS-001',
      status: 'SCHEDULED',
      scheduledStartAt: '2026-09-24T03:00:00Z',
      droneId: 'drone-1',
      droneCode: 'DRN-001',
      operatorId: 'operator-1',
      address: 'Site A',
      latitude: 10.5,
      longitude: 106.5,
    } as MissionResponse)

    expect(item.missionCode).toBe('MS-001')
    expect(item.serviceLabel).toBe('Survey')
    expect(item.scheduledEndAt).toBeNull()
    expect(item.operatorName).toBeNull()
    expect(item.orderCode).toBeNull()
  })
})

describe('missionsApi (mock mode)', () => {
  afterEach(() => {
    resetHttpTransport()
    resetMockDb()
  })

  it('createMission POSTs the request to /api/orders/{id}/missions', async () => {
    const stub = stubApi([
      {
        method: 'POST',
        path: '/api/orders/:id/missions',
        respond: { id: 'msn-1', missionCode: 'MSN-2609-0157-1', flightPlan: null },
      },
    ])
    const mission = await missionsApi.createMission('ord-1', validRequest)
    expect(mission.missionCode).toBe('MSN-2609-0157-1')
    expect(stub.calls).toHaveLength(1)
    expect(stub.calls[0]).toMatchObject({
      method: 'POST',
      path: '/api/orders/ord-1/missions',
      body: validRequest,
    })
  })

  it('createMission surfaces a 409 for a non-APPROVED order', async () => {
    stubApi([
      {
        method: 'POST',
        path: '/api/orders/:id/missions',
        respond: stubError(409, 'ORDER_NOT_APPROVED'),
      },
    ])
    await expect(
      missionsApi.createMission('ord-2609-0160', validRequest),
    ).rejects.toMatchObject({ status: 409 })
  })

  it('getMission GETs /api/missions/{id}', async () => {
    const stub = stubApi([
      {
        path: '/api/missions/:id',
        respond: ({ params }) => ({ id: params.id, orderCode: 'ORD-2609-0153' }),
      },
    ])
    const mission = await missionsApi.getMission('msn-2609-0153-1')
    expect(mission.orderCode).toBe('ORD-2609-0153')
    expect(stub.calls[0]).toMatchObject({
      method: 'GET',
      path: '/api/missions/msn-2609-0153-1',
    })
  })

  it('getMission surfaces a 404 for an unknown id', async () => {
    stubApi([
      { path: '/api/missions/:id', respond: stubError(404, 'NOT_FOUND') },
    ])
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

  it('assignDrone POSTs the device to assign-device as MAIN', async () => {
    const stub = stubApi([
      {
        method: 'POST',
        path: '/api/missions/:id/assign-device',
        respond: { id: 'msn-1', status: 'RESOURCE_ASSIGNING', droneId: 'drn-01' },
      },
    ])
    const mission = await missionsApi.assignDrone('msn-1', 'drn-01')
    expect(mission.status).toBe('RESOURCE_ASSIGNING')
    expect(stub.calls[0]).toMatchObject({
      path: '/api/missions/msn-1/assign-device',
      body: { deviceId: 'drn-01', deviceRole: 'MAIN' },
    })
  })

  it('assignDrone surfaces SCHEDULE_CONFLICT as a 409 ApiError', async () => {
    stubApi([
      {
        method: 'POST',
        path: '/api/missions/:id/assign-device',
        respond: stubError(409, 'SCHEDULE_CONFLICT'),
      },
    ])
    try {
      await missionsApi.assignDrone('msn-1', 'DRN-04')
      throw new Error('expected rejection')
    } catch (err) {
      expect(err).toBeInstanceOf(ApiError)
      expect((err as ApiError).status).toBe(409)
      expect((err as ApiError).code).toBe('SCHEDULE_CONFLICT')
    }
  })

  it('assignOperator POSTs the staff to assign-staff', async () => {
    const stub = stubApi([
      {
        method: 'POST',
        path: '/api/missions/:id/assign-staff',
        respond: { id: 'msn-1', status: 'WAITING_OPERATOR_ACCEPTANCE' },
      },
    ])
    const mission = await missionsApi.assignOperator('msn-1', 'HT')
    expect(mission.status).toBe('WAITING_OPERATOR_ACCEPTANCE')
    expect(stub.calls[0]).toMatchObject({
      path: '/api/missions/msn-1/assign-staff',
      body: { staffId: 'HT', assignedRole: 'PILOT' },
    })
  })

  it('releaseAssignment POSTs the reason to the release endpoint', async () => {
    const stub = stubApi([
      {
        method: 'POST',
        path: '/api/missions/:id/assignments/:aid/release',
        respond: { id: 'msn-1', status: 'CREATED', droneId: null },
      },
    ])
    const released = await missionsApi.releaseAssignment(
      'msn-1',
      'mda-1',
      'Drone bị gọi bảo trì khẩn',
    )
    expect(released.status).toBe('CREATED')
    expect(released.droneId).toBeNull()
    expect(stub.calls[0]).toMatchObject({
      path: '/api/missions/msn-1/assignments/mda-1/release',
      body: { releaseReason: 'Drone bị gọi bảo trì khẩn' },
    })
  })

  it('releaseAssignment surfaces a 400 for a blank reason', async () => {
    stubApi([
      {
        method: 'POST',
        path: '/api/missions/:id/assignments/:aid/release',
        respond: stubError(400, 'VALIDATION_ERROR'),
      },
    ])
    await expect(
      missionsApi.releaseAssignment('msn-1', 'mda-1', ''),
    ).rejects.toMatchObject({ status: 400 })
  })
})

// ── P6 API client tests ───────────────────────────────────────────────────

describe('missionsApi.listMissions', () => {
  it('returns the items array', async () => {
    stubApi([
      {
        path: '/api/missions',
        respond: { items: [{ id: 'm1', status: 'IN_FLIGHT' }] },
      },
    ])
    const result = await missionsApi.listMissions()
    expect(result.items).toHaveLength(1)
  })

  it('sends the status filter as a query param', async () => {
    const stub = stubApi([{ path: '/api/missions', respond: { items: [] } }])
    await missionsApi.listMissions({ status: 'IN_FLIGHT' })
    expect(stub.calls[0].query.get('status')).toBe('IN_FLIGHT')
  })
})

describe('missionsApi.patchSchedule', () => {
  it('updates the mission schedule', async () => {
    setHttpTransport(mockFetch)
    const updated = await missionsApi.patchSchedule('msn-2609-0153-1', {
      scheduledStart: '2026-09-26T10:00:00+07:00',
      scheduledEnd: '2026-09-26T11:30:00+07:00',
    })
    expect(updated.scheduledStartAt).toBe('2026-09-26T10:00:00+07:00')
  })

  it('throws ApiError 400 when body incomplete', async () => {
    setHttpTransport(mockFetch)
    await expect(
      missionsApi.patchSchedule('msn-2609-0153-1', {
        scheduledStart: '',
        scheduledEnd: '',
      }),
    ).rejects.toBeInstanceOf(ApiError)
  })
})

describe('missionsApi.getLive', () => {
  it('returns telemetry for MSN-2609-0142-1', async () => {
    setHttpTransport(mockFetch)
    const live = await missionsApi.getLive('msn-2609-0142-1')
    expect(live.missionStatus).toBe('IN_FLIGHT')
    expect(live.batteryPct).toBe(71)
    expect(live.livestream?.isLive).toBe(true)
  })
})

describe('missionsApi.createIncident', () => {
  it('creates an incident', async () => {
    setHttpTransport(mockFetch)
    const incident = await missionsApi.createIncident('msn-2609-0142-1', {
      type: 'WIND',
      description: 'Gió mạnh',
    })
    expect(incident.type).toBe('WIND')
  })
})

describe('missionsApi.cancelMission', () => {
  it('POSTs the reason to /api/missions/{id}/cancel', async () => {
    const stub = stubApi([
      {
        method: 'POST',
        path: '/api/missions/:id/cancel',
        respond: { id: 'msn-2609-0142-1', status: 'CANCELLED' },
      },
    ])
    const request = { expectedPlanRevision: 0, reason: 'Thời tiết xấu' }
    const m = await missionsApi.cancelMission('msn-2609-0142-1', request)
    expect(m.status).toBe('CANCELLED')
    expect(stub.calls[0]).toMatchObject({
      path: '/api/missions/msn-2609-0142-1/cancel',
      body: request,
    })
  })
})

describe('mission staff assignment contract', () => {
  it('assigns the selected flight operator as PILOT, not payload OPERATOR', async () => {
    let submitted: unknown
    setHttpTransport(async (_url, init) => {
      submitted = JSON.parse(String(init?.body))
      return Response.json({ success: true, data: { id: 'mission-1' } })
    })
    await missionsApi.assignOperator('mission-1', 'staff-1')
    expect(submitted).toEqual({ staffId: 'staff-1', assignedRole: 'PILOT' })
  })
})
