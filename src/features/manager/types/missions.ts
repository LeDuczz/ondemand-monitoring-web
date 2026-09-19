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

/**
 * Item returned by `GET /api/missions?from=&to=&status=` [TK].
 * Extends `Mission` with display-only fields from the calendar/live seed.
 */
export type MissionCalendarItem = Mission & {
  /** PROPOSED — derived from `mission.service_label` or order title; null when not sourced. */
  serviceLabel: string | null
  droneCode: string | null
  droneName: string | null
  operatorName: string | null
}

/** Body of `PATCH /api/missions/{id}/schedule` [ĐỀ XUẤT]. */
export type PatchScheduleRequest = {
  scheduledStart: string
  scheduledEnd: string
}

/** Active incident, returned inside `GET /api/missions/{id}/live` [ĐỀ XUẤT]. */
export type MissionIncident = {
  id: string
  type: string
  description: string
  reportedAt: string
}

/**
 * PROPOSED — livestream session state, nested in `LiveTelemetry`.
 * Fields come from brief's `live_stream_session` mention; WebRTC spike
 * is out-of-scope per evd/00-PLAN.md §8.
 */
export type LivestreamState = {
  sessionId: string
  /** null until a real WebRTC/RTSP URL is available. */
  playbackUrl: string | null
  isLive: boolean
}

/**
 * `GET /api/missions/{id}/live` response [BRIEF C4].
 * Polling endpoint; field names follow the design's data labels from
 * evd/design/MNG-07.dc.html verbatim.
 */
export type LiveTelemetry = {
  missionStatus: MissionStatus
  /** null when drone not assigned or telemetry unavailable. */
  droneStatus: string | null
  droneCode: string | null
  droneName: string | null
  operatorName: string | null
  /** Battery percentage 0–100; null when no telemetry. */
  batteryPct: number | null
  /** Seconds in flight; null when not in-flight. */
  flightTimeSec: number | null
  latitude: number | null
  longitude: number | null
  /** Altitude in metres ASL; null when no telemetry. */
  altitudeM: number | null
  /** Speed in m/s; null when no telemetry. */
  speedMs: number | null
  /** Signal strength in dBm; PROPOSED. */
  signalDbm: number | null
  /** GPS satellite count; null when no telemetry. */
  satelliteCount: number | null
  connectionStatus: string | null
  telemetryActive: boolean
  lastTelemetryAt: string | null
  activeIncidents: MissionIncident[]
  /** null when no livestream session exists. PROPOSED — see LivestreamState. */
  livestream: LivestreamState | null
}

/** Body of `POST /api/missions/{id}/incidents` [ĐỀ XUẤT]. */
export type CreateIncidentRequest = {
  type: string
  description: string
}

/** Body of `POST /api/missions/{id}/cancel` [ĐỀ XUẤT]. */
export type CancelMissionRequest = {
  reason: string
}

/** Body of `POST /api/orders/{id}/missions` [BRIEF C4 = TK]. */
export type CreateMissionRequest = {
  scheduledStart: string
  scheduledEnd: string
  flightPlan: FlightPlan
  waypoints: MissionWaypoint[]
}

export type ResourceCandidateBase = {
  score: number
  /** (AI diễn giải, điểm số do hệ thống tính) [TK MNG-05]. */
  reason: string
}

export type DroneCandidate = ResourceCandidateBase & {
  code: string
  name: string
  serialNumber: string
  droneModelName: string
  batteryPct: number
  distanceKm: number
  enduranceMarginPct: number
  payload: string
  hoursSinceMaintenance: number
}

export type OperatorCandidate = ResourceCandidateBase & {
  code: string
  fullName: string
  licenseClass: string
  licenseNumber: string
  licenseExpiry: string
  missionsWithModel: number
  successRatePct: number
  acceptanceRatePct: number
  missionsThisWeek: number
}

export type RejectedDrone = { code: string; reason: string }
export type RejectedOperator = { name: string; reason: string }

export type AlternativeSlot = {
  priority: number
  label: string
  dateLabel: string
  windowLabel: string
  eligibleDroneCount: number
  eligibleOperatorCount: number
}

export type TimelineBooking = {
  missionCode: string
  start: string | null
  end: string | null
  conflict: boolean
}

export type TimelineResource = {
  code: string
  name: string
  kind: 'DRONE' | 'OPERATOR'
  rejected: boolean
  rejectedReason: string | null
  bookings: TimelineBooking[]
}

/**
 * `GET /api/missions/{id}/resource-suggestions` [BRIEF C4]. `feasible:
 * false` mirrors the MNG-05 "không đủ nguồn lực" state — `topDrones`/
 * `topOperators` are then empty and `alternatives` lists replacement dates.
 */
export type ResourceSuggestions = {
  feasible: boolean
  missionCode: string
  attemptNumber: number
  scheduledStart: string
  scheduledEnd: string
  addressText: string | null
  centerLat: number | null
  centerLon: number | null
  radiusM: number | null
  mediaSummary: string | null
  requiredDurationLabel: string | null
  requiredSensor: string | null
  nearestBase: string | null
  eligibleDroneCount: number
  eligibleOperatorCount: number
  topDrones: DroneCandidate[]
  topOperators: OperatorCandidate[]
  rejected: {
    drones: RejectedDrone[]
    operators: RejectedOperator[]
  }
  explanation: string
  timeline: {
    date: string
    windowStart: string
    windowEnd: string
    resources: TimelineResource[]
  }
  alternatives: AlternativeSlot[]
}
