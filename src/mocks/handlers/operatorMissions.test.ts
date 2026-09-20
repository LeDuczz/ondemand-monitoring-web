import { afterEach, describe, it, expect, beforeEach } from 'vitest'
import {
  registerMockRoutes,
  resetMockRoutes,
  mockFetch,
  ok,
  fail,
} from '../mockServer'
import missionsData from '../data/operator-missions.json'
import type { OperatorMission } from '../../features/drone-operator/omss/types'

const missions: OperatorMission[] = JSON.parse(
  JSON.stringify(missionsData.missions),
) as OperatorMission[]

function setupRoutes() {
  registerMockRoutes([
    {
      method: 'GET',
      path: '/api/operator/profile',
      handler: () => ok(missionsData.operator),
    },
    {
      method: 'GET',
      path: '/api/operator/missions',
      handler: ({ query }) => {
        const tab = query.get('tab') ?? 'all'
        let items = missions
        if (tab === 'pending') items = missions.filter((m) => m.state === 'WAITING_OPERATOR_ACCEPTANCE')
        else if (tab === 'history') items = missions.filter((m) => m.state === 'COMPLETED' || m.state === 'CANCELLED')
        return ok({ items, total: items.length })
      },
    },
    {
      method: 'GET',
      path: '/api/operator/missions/:id',
      handler: ({ params }) => {
        const mission = missions.find((m) => m.id === params['id'])
        if (!mission) return fail(404, 'NOT_FOUND', 'Mission không tồn tại')
        return ok(mission)
      },
    },
    {
      method: 'POST',
      path: '/api/operator/missions/:id/accept',
      handler: ({ params }) => {
        const idx = missions.findIndex((m) => m.id === params['id'])
        if (idx === -1) return fail(404, 'NOT_FOUND', 'Mission không tồn tại')
        const m = missions[idx]!
        if (m.state !== 'WAITING_OPERATOR_ACCEPTANCE') {
          return fail(409, 'INVALID_STATE', 'Mission không ở trạng thái chờ phản hồi')
        }
        missions[idx] = { ...m, state: 'SCHEDULED' }
        return ok(missions[idx])
      },
    },
    {
      method: 'POST',
      path: '/api/operator/missions/:id/reject',
      handler: ({ params, body }) => {
        const idx = missions.findIndex((m) => m.id === params['id'])
        if (idx === -1) return fail(404, 'NOT_FOUND', 'Mission không tồn tại')
        const payload = body as { reason?: string }
        const m = missions[idx]!
        missions[idx] = { ...m, state: 'CANCELLED', rejectionReason: payload?.reason ?? 'Không rõ lý do' }
        return ok(missions[idx])
      },
    },
  ])
}

describe('operatorMissions mock handlers', () => {
  beforeEach(() => {
    setupRoutes()
  })

  afterEach(() => {
    resetMockRoutes()
  })

  it('GET /api/operator/profile returns operator info', async () => {
    const res = await mockFetch('http://localhost/api/operator/profile')
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.success).toBe(true)
    expect(json.data.fullName).toBe('Hoàng Đức Thắng')
    expect(json.data.licenseGrade).toBe('B')
  })

  it('GET /api/operator/missions?tab=pending returns only pending missions', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions?tab=pending',
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.items.length).toBeGreaterThan(0)
    for (const m of json.data.items) {
      expect(m.state).toBe('WAITING_OPERATOR_ACCEPTANCE')
    }
  })

  it('GET /api/operator/missions?tab=history returns completed/cancelled', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions?tab=history',
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    for (const m of json.data.items) {
      expect(['COMPLETED', 'CANCELLED']).toContain(m.state)
    }
  })

  it('GET /api/operator/missions/:id returns mission detail', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0152-1',
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.id).toBe('MSN-2609-0152-1')
  })

  it('GET /api/operator/missions/:id returns 404 for unknown id', async () => {
    const res = await mockFetch('http://localhost/api/operator/missions/UNKNOWN')
    const json = await res.json()
    expect(res.status).toBe(404)
    expect(json.success).toBe(false)
  })

  it('POST /accept changes mission state to SCHEDULED', async () => {
    // Use MSN-2609-0154-1 which is WAITING_OPERATOR_ACCEPTANCE
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0154-1/accept',
      { method: 'POST' },
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.state).toBe('SCHEDULED')
  })

  it('POST /reject changes mission state to CANCELLED with reason', async () => {
    const res = await mockFetch(
      'http://localhost/api/operator/missions/MSN-2609-0152-1/reject',
      {
        method: 'POST',
        body: JSON.stringify({ reason: 'Trùng lịch cá nhân' }),
        headers: { 'Content-Type': 'application/json' },
      },
    )
    const json = await res.json()
    expect(res.status).toBe(200)
    expect(json.data.state).toBe('CANCELLED')
    expect(json.data.rejectionReason).toBe('Trùng lịch cá nhân')
  })
})
