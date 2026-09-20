import { registerMockRoutes, ok, fail } from '../mockServer'
import missionsData from '../data/operator-missions.json'
import type { OperatorMission } from '../../features/drone-operator/omss/types'

// Mutable in-memory copy so accept/reject mutate state within session
const missions: OperatorMission[] = missionsData.missions as OperatorMission[]

function tabFilter(mission: OperatorMission, tab: string): boolean {
  if (tab === 'pending') {
    return mission.state === 'WAITING_OPERATOR_ACCEPTANCE'
  }
  if (tab === 'upcoming') {
    return (
      mission.state === 'SCHEDULED' ||
      mission.state === 'IN_FLIGHT' ||
      mission.state === 'CONNECTED' ||
      mission.state === 'PREFLIGHT_CHECKING' ||
      mission.state === 'READY_TO_FLY' ||
      mission.state === 'RETURNING' ||
      mission.state === 'POSTFLIGHT_CHECKING'
    )
  }
  if (tab === 'history') {
    return mission.state === 'COMPLETED' || mission.state === 'CANCELLED'
  }
  return true
}

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
      const items = missions.filter((m) => tabFilter(m, tab))
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
      const m = missions[idx]!
      const payload = body as { reason?: string; notes?: string }
      missions[idx] = {
        ...m,
        state: 'CANCELLED',
        rejectionReason: payload?.reason ?? 'Không rõ lý do',
      }
      return ok(missions[idx])
    },
  },
])
