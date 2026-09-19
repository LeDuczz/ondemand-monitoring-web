// Types for MNG-04 (create mission from an approved order) and MNG-05
// (resource dispatch). Field names follow [BE] `MissionResponse` / brief
// `flight_plan` / `flight_waypoint` / `mission_drone_assignment` /
// `mission_operator_assignment` tables [BRIEF §A6] where they overlap.
import type { MissionStatus } from '../../../shared/types/domain'
import type { WaypointAction } from '../lib/waypoints'

/** `flight_plan.plan_type` [BRIEF §A6]. */
export type PlanType = 'ORBIT' | 'GRID' | 'POINT'

/** `flight_plan.generated_by` [BRIEF §A6]. */
export type PlanGeneratedBy = 'SYSTEM' | 'MANUAL'

export type MissionWaypoint = {
  seq: number
  action: WaypointAction
  lat: number
  lon: number
  altM: number
}

/** `flight_plan` row [BRIEF §A6], attached to a mission by API 1. */
export type FlightPlan = {
  planType: PlanType
  centerLat: number
  centerLon: number
  radiusM: number
  altitudeM: number
  /** null when no drone-specific cruise speed has been sourced yet. */
  speedMs: number | null
  estimatedDurationSec: number
  generatedBy: PlanGeneratedBy
}

export type MissionMediaRequirement =
  | { mediaType: 'VIDEO'; quantity: number; durationSec: number }
  | { mediaType: 'PHOTO'; quantity: number; width: number; height: number }
  | { mediaType: 'LIVESTREAM'; quantity: number; durationSec: number }

/**
 * `GET /api/missions/{id}` [BE `MissionResponse`] plus brief-only fields
 * (`flightPlan`, `waypoints`, `mediaRequirements`, `requiredSensor`,
 * `nearestBase`, assignment ids) marked PROPOSED where MissionResponse
 * itself has no matching field — needed by MNG-04/05 but not present on
 * the backend DTO we read.
 */
export type Mission = {
  id: string
  orderId: string
  orderCode: string
  missionCode: string
  status: MissionStatus
  attemptNumber: number
  droneId: string | null
  operatorId: string | null
  /** PROPOSED — id of the current `mission_drone_assignment` row, needed for release. */
  droneAssignmentId: string | null
  /** PROPOSED — id of the current `mission_operator_assignment` row, needed for release. */
  operatorAssignmentId: string | null
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  addressText: string | null
  centerLat: number | null
  centerLon: number | null
  radiusM: number | null
  /** PROPOSED — `flight_plan.mission_id` requires a required sensor per media_requirement; brief has no single field, MNG-05 renders one value. */
  requiredSensor: string | null
  nearestBase: string | null
  mediaRequirements: MissionMediaRequirement[]
  flightPlan: FlightPlan | null
  waypoints: MissionWaypoint[]
}

/** Body of `POST /api/orders/{id}/missions` [BRIEF C4 = TK]. */
export type CreateMissionRequest = {
  scheduledStart: string
  scheduledEnd: string
  flightPlan: FlightPlan
  waypoints: MissionWaypoint[]
}
