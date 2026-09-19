// Mock handlers for MNG-04 (create mission from an approved order) and
// MNG-05 (resource dispatch). Endpoints, per the P5 task brief:
//   POST /api/orders/{id}/missions                      [BRIEF C4 = TK]
//   GET  /api/missions/{id}                              [BE]
//   GET  /api/missions/{id}/resource-suggestions         [BRIEF C4]
//   POST /api/missions/{id}/assign-drone?droneId=        [BE]
//   POST /api/missions/{id}/assign-operator?operatorId=  [BE]
//   POST /api/missions/{id}/assignments/{aid}/release    [BRIEF C4 = TK]
import type {
  Mission,
  ResourceSuggestions,
} from '../../features/manager/types/missions'
import { NO_FLY_CEILING_M } from '../../features/manager/lib/missionPolicy'
import { hasScheduleConflict } from '../../features/manager/lib/schedule'
import { createCollection } from '../db'
import { fail, ok, created, registerMockRoutes } from '../mockServer'
import resourceSuggestionsSeed from '../data/resource-suggestions.json'
import dronesSeed from '../data/drones.json'
import operatorsSeed from '../data/operators.json'
import { findOrder } from './ordersStore'
import {
  findMissionById,
  findMissionsForOrder,
  missions,
  newMinimalMission,
  type StoredMission,
} from './missionsStore'

// PROPOSED deterministic trigger for the 422 FLIGHT_PLAN_GENERATION_FAILED
// state [TK MNG-04] — no source gives a real generator failure condition.
const FLIGHT_PLAN_RADIUS_FAILURE_LIMIT_M = 800

type SeedDrone = {
  id: string
  code: string
  status: string
  existingBookings?: { missionCode: string; start: string; end: string }[]
}

type SeedOperator = {
  id: string
  code: string | null
  fullName: string
}

const suggestions = createCollection(
  resourceSuggestionsSeed,
) as typeof resourceSuggestionsSeed
const drones = createCollection(dronesSeed.drones) as SeedDrone[]
const operators = createCollection(operatorsSeed.operators) as SeedOperator[]

function toMissionDto(m: StoredMission): Mission {
  return {
    id: m.id,
    orderId: m.orderId,
    orderCode: m.orderCode,
    missionCode: m.missionCode,
    status: m.status,
    attemptNumber: m.attemptNumber,
    droneId: m.droneId,
    operatorId: m.operatorId,
    droneAssignmentId: m.droneAssignmentId,
    operatorAssignmentId: m.operatorAssignmentId,
    scheduledStartAt: m.scheduledStartAt,
    scheduledEndAt: m.scheduledEndAt,
    addressText: m.addressText,
    centerLat: m.centerLat,
    centerLon: m.centerLon,
    radiusM: m.radiusM,
    requiredSensor: m.requiredSensor,
    nearestBase: m.nearestBase,
    mediaRequirements: m.mediaRequirements as Mission['mediaRequirements'],
    flightPlan: m.flightPlan as Mission['flightPlan'],
    waypoints: m.waypoints as Mission['waypoints'],
  }
}

registerMockRoutes([
  {
    method: 'POST',
    path: '/api/orders/:id/missions',
    handler: ({ params, body }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      if (order.status !== 'APPROVED') {
        return fail(
          409,
          'ORDER_NOT_APPROVED',
          'Đơn chưa được duyệt, chưa thể tạo mission.',
        )
      }

      const req = (body ?? {}) as {
        scheduledStart?: string
        scheduledEnd?: string
        flightPlan?: {
          planType: 'ORBIT' | 'GRID' | 'POINT'
          centerLat: number
          centerLon: number
          radiusM: number
          altitudeM: number
          speedMs: number | null
          estimatedDurationSec: number
          generatedBy: 'SYSTEM' | 'MANUAL'
        }
        waypoints?: StoredMission['waypoints']
      }

      if (!req.scheduledStart || !req.scheduledEnd || !req.flightPlan) {
        return fail(
          400,
          'VALIDATION_ERROR',
          'Thiếu thông tin lịch bay hoặc flight plan',
          { flightPlan: 'flightPlan là bắt buộc' },
        )
      }

      if (req.flightPlan.altitudeM > NO_FLY_CEILING_M) {
        return fail(
          400,
          'VALIDATION_ERROR',
          `Độ cao ${req.flightPlan.altitudeM} m vượt trần cấm bay ${NO_FLY_CEILING_M} m.`,
          { altitudeM: `Không được vượt quá ${NO_FLY_CEILING_M} m` },
        )
      }

      if (req.flightPlan.radiusM > FLIGHT_PLAN_RADIUS_FAILURE_LIMIT_M) {
        return fail(
          422,
          'FLIGHT_PLAN_GENERATION_FAILED',
          'Dịch vụ tạo đường bay báo lỗi cho khu vực này. Bạn có thể nhập waypoint thủ công.',
        )
      }

      // Conflict resolution [documented in evd/P5-manager-mission-dispatch.md]:
      // the backend's `POST /orders/{id}/approve` already creates a bare
      // CREATED mission with no plan. Attach this request's plan/schedule
      // to that mission if one exists without a plan yet; otherwise this is
      // a re-plan attempt (e.g. after a manual retry) — start a new
      // `...-N+1` mission attempt.
      const existing = findMissionsForOrder(order.id).find(
        (m) => m.status === 'CREATED' && !m.flightPlan,
      )
      const mission = existing ?? newMinimalMission(order.id, order.code)
      if (!existing) missions.push(mission)

      mission.scheduledStartAt = req.scheduledStart
      mission.scheduledEndAt = req.scheduledEnd
      mission.flightPlan = req.flightPlan
      mission.waypoints = req.waypoints ?? []
      mission.centerLat = req.flightPlan.centerLat
      mission.centerLon = req.flightPlan.centerLon
      mission.radiusM = req.flightPlan.radiusM

      return created(toMissionDto(mission), 'Đã tạo flight plan cho mission')
    },
  },
  {
    method: 'GET',
    path: '/api/missions/:id',
    handler: ({ params }) => {
      const mission = findMissionById(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')
      return ok(toMissionDto(mission))
    },
  },
  {
    method: 'GET',
    path: '/api/missions/:id/resource-suggestions',
    handler: ({ params, query }) => {
      const mission = findMissionById(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')
      const scenarios = (
        suggestions as unknown as {
          byMission: Record<
            string,
            {
              default: ResourceSuggestions
              insufficient: ResourceSuggestions
            }
          >
          timeline: Record<string, ResourceSuggestions['timeline']>
        }
      ).byMission[mission.id]
      if (!scenarios) {
        return fail(
          404,
          'NOT_FOUND',
          'Chưa có gợi ý nguồn lực cho mission này.',
        )
      }
      const scenario = query.get('scenario')
      const base =
        scenario === 'insufficient' ? scenarios.insufficient : scenarios.default
      const timeline = (
        suggestions as unknown as {
          timeline: Record<string, ResourceSuggestions['timeline']>
        }
      ).timeline[mission.id]

      const response: ResourceSuggestions = {
        ...base,
        missionCode: mission.missionCode,
        attemptNumber: mission.attemptNumber,
        scheduledStart: mission.scheduledStartAt ?? '',
        scheduledEnd: mission.scheduledEndAt ?? '',
        addressText: mission.addressText,
        centerLat: mission.centerLat,
        centerLon: mission.centerLon,
        radiusM: mission.radiusM,
        mediaSummary:
          mission.mediaRequirements.length > 0
            ? mission.mediaRequirements
                .map((r) =>
                  r.mediaType === 'VIDEO'
                    ? `VIDEO ${r.quantity} × ${r.durationSec} s`
                    : r.mediaType === 'PHOTO'
                      ? `PHOTO ${r.quantity}${'width' in r ? ` · ${r.width}×${r.height}` : ''}`
                      : `LIVESTREAM ${r.quantity} × ${r.durationSec} s`,
                )
                .join(' · ')
            : null,
        requiredDurationLabel: mission.flightPlan
          ? `T_required ≈ ${Math.round(mission.flightPlan.estimatedDurationSec / 60)} phút (${mission.flightPlan.planType}, ${mission.flightPlan.altitudeM} m)`
          : null,
        requiredSensor: mission.requiredSensor,
        nearestBase: mission.nearestBase,
        timeline: timeline ?? {
          date: '',
          windowStart: '',
          windowEnd: '',
          resources: [],
        },
      }
      return ok(response)
    },
  },
  {
    method: 'POST',
    path: '/api/missions/:id/assign-drone',
    handler: ({ params, query }) => {
      const mission = findMissionById(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')
      const droneId = query.get('droneId')
      if (!droneId) {
        return fail(400, 'VALIDATION_ERROR', 'Thiếu droneId', {
          droneId: 'droneId là bắt buộc',
        })
      }
      const drone = drones.find((d) => d.id === droneId || d.code === droneId)
      if (!drone) return fail(404, 'NOT_FOUND', 'Không tìm thấy drone')

      if (mission.scheduledStartAt && mission.scheduledEndAt) {
        const conflict = hasScheduleConflict(
          { start: mission.scheduledStartAt, end: mission.scheduledEndAt },
          drone.existingBookings ?? [],
        )
        if (conflict) {
          return fail(
            409,
            'SCHEDULE_CONFLICT',
            `Máy chủ từ chối: khung ${conflict.start.slice(11, 16)}–${conflict.end.slice(11, 16)} vừa bị ${conflict.missionCode} chiếm (ràng buộc EXCLUDE trên scheduled_range). Chọn drone khác hoặc đổi giờ mission.`,
          )
        }
      }

      mission.droneId = drone.id
      mission.droneAssignmentId = `mda-${mission.id}-${drone.id}`
      mission.status = mission.operatorId
        ? 'WAITING_OPERATOR_ACCEPTANCE'
        : 'RESOURCE_ASSIGNING'
      return ok(toMissionDto(mission), 'Đã gán Drone thành công')
    },
  },
  {
    method: 'POST',
    path: '/api/missions/:id/assign-operator',
    handler: ({ params, query }) => {
      const mission = findMissionById(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')
      const operatorId = query.get('operatorId')
      if (!operatorId) {
        return fail(400, 'VALIDATION_ERROR', 'Thiếu operatorId', {
          operatorId: 'operatorId là bắt buộc',
        })
      }
      const operator = operators.find(
        (o) => o.id === operatorId || o.code === operatorId,
      )
      if (!operator) return fail(404, 'NOT_FOUND', 'Không tìm thấy phi công')

      mission.operatorId = operator.id
      mission.operatorAssignmentId = `moa-${mission.id}-${operator.id}`
      mission.status = mission.droneId
        ? 'WAITING_OPERATOR_ACCEPTANCE'
        : 'RESOURCE_ASSIGNING'
      return ok(toMissionDto(mission), 'Đã gán Operator thành công')
    },
  },
  {
    method: 'POST',
    path: '/api/missions/:id/assignments/:aid/release',
    handler: ({ params, body }) => {
      const mission = findMissionById(params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Không tìm thấy mission')
      const { releaseReason } = (body ?? {}) as { releaseReason?: string }
      if (!releaseReason || !releaseReason.trim()) {
        return fail(400, 'VALIDATION_ERROR', 'Yêu cầu nhập lý do thu hồi', {
          releaseReason: 'Lý do là bắt buộc',
        })
      }
      if (
        params.aid !== mission.droneAssignmentId &&
        params.aid !== mission.operatorAssignmentId
      ) {
        return fail(404, 'NOT_FOUND', 'Không tìm thấy assignment')
      }
      if (params.aid === mission.droneAssignmentId) {
        mission.droneId = null
        mission.droneAssignmentId = null
      }
      if (params.aid === mission.operatorAssignmentId) {
        mission.operatorId = null
        mission.operatorAssignmentId = null
      }
      mission.status = 'CREATED'
      return ok(toMissionDto(mission), 'Đã thu hồi phân công')
    },
  },
])

/** Test-only escape hatch to assert on the in-memory mock collections. */
export const __testing = { missions, drones, operators }
