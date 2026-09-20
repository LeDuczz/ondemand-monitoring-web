// Mock handlers for the Drone Operator portal (OPR-xxW):
//   GET /api/operator/profile
//   GET /api/operator/missions[?tab=pending|upcoming|history]
//   GET /api/operator/missions/:id
import { missionsByTab } from '../../features/drone-operator/lib/filterMissions'
import type {
  ControlHandover,
  FlightConnection,
  OperatorMission,
  OperatorMissionTab,
  OperatorProfile,
  PreflightItem,
  PreflightRecord,
} from '../../features/drone-operator/types/mission'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import seed from '../data/operator-missions.json'

const profile = seed.profile as OperatorProfile
const missions = createCollection(
  seed.missions as OperatorMission[],
) as unknown as OperatorMission[]

const connections = createCollection({} as Record<string, FlightConnection>)
const handovers = createCollection({} as Record<string, ControlHandover>)
const preflights = createCollection({} as Record<string, PreflightRecord>)

const TABS: OperatorMissionTab[] = ['pending', 'upcoming', 'history']

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/operator/profile',
    handler: () => ok(profile),
  },
  {
    method: 'GET',
    path: '/api/operator/missions',
    handler: ({ query }) => {
      const tab = query.get('tab') as OperatorMissionTab | null
      if (tab && !TABS.includes(tab)) {
        return fail(400, 'INVALID_TAB', `Unknown tab: ${tab}`)
      }
      const items = tab ? missionsByTab(missions, tab, new Date()) : missions
      return ok({ items })
    },
  },
  {
    method: 'GET',
    path: '/api/operator/missions/:id',
    handler: ({ params }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      return ok(mission)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/accept',
    handler: ({ params }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      if (mission.status !== 'PENDING') {
        return fail(409, 'INVALID_STATE', 'Mission is not pending')
      }
      mission.status = 'ACCEPTED'
      mission.acceptedAt = new Date().toISOString()
      return ok(mission)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/reject',
    handler: ({ params, body }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      if (mission.status !== 'PENDING') {
        return fail(409, 'INVALID_STATE', 'Mission is not pending')
      }
      const { reason, notes } = (body ?? {}) as {
        reason?: string
        notes?: string
      }
      if (!reason) return fail(400, 'REASON_REQUIRED', 'Reason is required')
      mission.status = 'REJECTED'
      mission.rejectReason = notes ? `${reason}: ${notes}` : reason
      return ok(mission)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/connect',
    handler: ({ params, body }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      const { token, gcsId } = (body ?? {}) as {
        token?: string
        gcsId?: string
      }
      if (!token) return fail(400, 'TOKEN_REQUIRED', 'flight_token is required')
      if (!gcsId) return fail(400, 'GCS_REQUIRED', 'gcs_identifier is required')
      const connection: FlightConnection = {
        status: 'CONNECTED',
        token,
        gcsId,
        connectedAt: new Date().toISOString(),
      }
      connections[mission.id] = connection
      return ok(connection)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/handover',
    handler: ({ params }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      if (
        !connections[mission.id] ||
        connections[mission.id].status !== 'CONNECTED'
      ) {
        return fail(409, 'NOT_CONNECTED', 'Drone chưa kết nối GCS')
      }
      const handover: ControlHandover = {
        status: 'CONFIRMED',
        confirmedAt: new Date().toISOString(),
      }
      handovers[mission.id] = handover
      return ok(handover)
    },
  },
  {
    method: 'POST',
    path: '/api/operator/missions/:id/preflight',
    handler: ({ params, body }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      const { items } = (body ?? {}) as { items?: PreflightItem[] }
      if (!Array.isArray(items) || items.length === 0) {
        return fail(400, 'ITEMS_REQUIRED', 'Checklist items are required')
      }
      const invalidFail = items.find(
        (item) => item.result === 'fail' && !item.note,
      )
      if (invalidFail) {
        return fail(
          400,
          'NOTE_REQUIRED',
          `Ghi chú lỗi bắt buộc cho ${invalidFail.key}`,
        )
      }
      const record: PreflightRecord = {
        items,
        savedAt: new Date().toISOString(),
      }
      preflights[mission.id] = record
      return ok(record)
    },
  },
])
