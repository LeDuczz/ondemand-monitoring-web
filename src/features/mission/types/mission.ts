export type MissionStatus =
  | 'CREATED'
  | 'RESOURCE_ASSIGNING'
  | 'WAITING_OPERATOR_ACCEPTANCE'
  | 'SCHEDULED'
  | 'CONNECTED'
  | 'PREFLIGHT_CHECKING'
  | 'READY_TO_FLY'
  | 'FAILED_PREFLIGHT'
  | 'PENDING_APPROVAL'
  | 'IN_FLIGHT'
  | 'IN_PROGRESS'
  | 'RETURNING'
  | 'POSTFLIGHT_CHECKING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type DeviceStatus =
  | 'AVAILABLE'
  | 'PREFLIGHT'
  | 'ACTIVE_MISSION'
  | 'IDLE_CHARGING'
  | 'MAINTENANCE'
  | 'OFFLINE'

export type MediaType = 'IMAGE' | 'VIDEO' | 'THERMAL'

export type PlanningAlgorithm =
  | 'DIRECT'
  | 'ASTAR_SHORTEST'
  | 'ASTAR_ENERGY_AWARE'

export type FeasibilityStatus =
  | 'FEASIBLE'
  | 'INSUFFICIENT_BATTERY'
  | 'NO_SAFE_ROUTE'
  | 'INVALID_TARGET'

export interface PlanWaypoint {
  id: string
  sequence: number
  simX: number
  simY: number
  altitudeM: number
  plannedSpeedMps?: number | null
  reason: 'START' | 'CRUISE' | 'TARGET'
}

export interface MissionPlan {
  id: string
  planningAlgorithm: PlanningAlgorithm
  plannedDistanceM?: number | null
  plannedDurationSec?: number | null
  plannedCruiseSpeedMps?: number | null
  maxPlannedAltitudeM?: number | null
  estimatedEnergyMah?: number | null
  estimatedBatteryUsedPercent?: number | null
  availableBatteryPercentAtPlanning?: number | null
  safetyReservePercent?: number | null
  requiredBatteryPercent?: number | null
  feasibilityStatus: FeasibilityStatus
  planningTimeMs?: number | null
  waypoints: PlanWaypoint[]
}

export interface Mission {
  id: string
  missionCode: string
  status: MissionStatus
  deviceId?: string
  deviceCode?: string
  operatorId?: string
  latitude: number
  longitude: number
  address?: string
  scheduledStartAt?: string
  startedAt?: string
  completedAt?: string
  description?: string
  failureReason?: string
  rejectionReason?: string
  mediaType?: MediaType
  plan?: MissionPlan | null
}

export interface PreflightCheck {
  id: string
  deviceCode: string
  missionId?: string
  checkedAt: string
  overallPassed: boolean
  batteryPercent: number
  batteryPassed: boolean
  gpsSatelliteCount: number
  gpsPassed: boolean
  sensorsPassed: boolean
  positioningPassed: boolean
  faultType?: 'BATTERY' | 'HARDWARE' | 'NONE'
  failureReason?: string
  flightToken?: FlightToken
  notes?: string
}

export interface FlightToken {
  id: string
  tokenValue: string
  missionId: string
  deviceCode: string
  issuedAt: string
  expiresAt: string
  usedAt?: string
  revoked: boolean
}

export interface DeviceImage {
  id: string
  missionId?: string
  deviceCode?: string
  droneId?: string
  storageKey?: string
  fileName?: string
  contentType?: string
  fileSizeBytes?: number
  capturedAt?: string
  presignedUrl?: string
}

export interface TelemetryData {
  deviceCode: string
  connected: boolean
  batteryPercent: number
  gpsSatelliteCount: number
  gpsFixType: string
  gyrometerOk: boolean
  accelerometerOk: boolean
  magnetometerOk: boolean
  localPositionOk: boolean
  globalPositionOk: boolean
  homePositionOk: boolean
  armable: boolean
  inAir: boolean
  altitude: number
  speed: number
}
