export type MissionState =
  | 'WAITING_OPERATOR_ACCEPTANCE'
  | 'RESOURCE_ASSIGNING'
  | 'SCHEDULED'
  | 'CONNECTED'
  | 'PREFLIGHT_CHECKING'
  | 'READY_TO_FLY'
  | 'FAILED_PREFLIGHT'
  | 'PENDING_APPROVAL'
  | 'IN_FLIGHT'
  | 'RETURNING'
  | 'POSTFLIGHT_CHECKING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export type DroneState =
  'AVAILABLE' | 'PREFLIGHT' | 'ACTIVE_MISSION' | 'IDLE_CHARGING' | 'MAINTENANCE'

export type CheckStatus = 'PASS' | 'FAIL' | 'WARNING' | 'PENDING'

export interface CheckItem {
  id: string
  label: string
  icon: 'battery' | 'gps' | 'camera' | 'storage' | 'signal' | 'weather'
  value: string
  requirement: string
  status: CheckStatus
  explanation: string
  action?: string
}

export interface Drone {
  id: string
  name: string
  model: string
  serialNumber: string
  state: DroneState
  battery: number // %
  gpsCount: number // satellites
  gpsHdop: number
  altitude: number // m AGL
  groundSpeed: number // m/s
  verticalSpeed: number // m/s
  heading: number // degrees
  lat: number
  lng: number
  storageMB: number
  telemetryAge: number // seconds
  cameraOk: boolean
  gimbalOk: boolean
  rssi: number // %
  voltage: number // V
  currentAmps: number
  tempC: number
}

export interface Mission {
  id: string
  orderRef: string
  orderTitle?: string
  title: string
  state: MissionState
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL'
  droneId: string
  operatorId: string
  customer: string
  location: string
  lat: number
  lng: number
  scheduledAt: string
  estimatedMinutes: number
  distanceKm: number
  flightPlanId: string
  maxAltitudeM: number
  notes: string
  rejectionReason?: string
  targetSimX?: number
  targetSimY?: number
  routePoints?: MissionRoutePoint[]
}

export interface MissionRoutePoint {
  id: string
  sequence: number
  simX: number
  simY: number
  altitudeM: number
  speedMps?: number
  reason: string
}

export interface FlightToken {
  token: string
  issuedAt: number
  expiresAt: number
  missionId: string
  droneId: string
}

export type Role = 'operator' | 'customer' | 'manager' | 'sysop' | 'admin'

// ── Operator availability ─────────────────────────────────────
export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFF'

export type AvailabilitySlot = {
  date: string // YYYY-MM-DD
  hour: number // 0–23
  minute: number // 0 or 30
  status: AvailabilityStatus
}

export type MissionOverlay = {
  missionId: string
  date: string
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
}

// ── GCS / connection ──────────────────────────────────────────
export type GCSDevice = { id: string; label: string }

export type FlightConnection = {
  id: string
  missionId: string
  droneId: string
  gcsId: string
  tokenUsedAt: string
  connectedAt: string
  status: 'CONNECTED' | 'DISCONNECTED' | 'FAILED'
}

// ── Media upload ──────────────────────────────────────────────
export type MediaFileStatus = 'PENDING' | 'UPLOADING' | 'DONE' | 'FAILED' | 'QUEUED'

export type MediaFile = {
  id: string
  name: string
  type: 'PHOTO' | 'VIDEO'
  sizeMB: number
  progressPct: number
  attempts: number
  maxAttempts: number
  status: MediaFileStatus
}

// ── Maintenance ───────────────────────────────────────────────
export type MaintenanceFaultType =
  | 'MOTOR_VIBRATION'
  | 'SIGNAL_LOSS'
  | 'BATTERY_DEGRADED'
  | 'CAMERA_GIMBAL'
  | 'PHYSICAL_DAMAGE'
  | 'OTHER'

// ── Operator profile ──────────────────────────────────────────
export type OperatorProfile = {
  id: string
  fullName: string
  licenseGrade: string
  certExpiryDate: string
  station: string
}

// ── Operator-extended Mission (from API) ──────────────────────
export type OperatorMission = {
  id: string
  orderRef: string
  title: string
  subtitle: string
  state: MissionState
  scheduledAt: string
  endAt: string
  estimatedMinutes: number
  location: string
  droneId: string
  droneName: string
  droneModel: string
  payload: string
  stationName: string
  stationDistanceKm: number
  droneBattery: number
  droneHoursFromMaintenance: number
  droneStatus: DroneState
  lat: number
  lng: number
  surveillanceRadiusM: number
  maxAltitudeM: number
  photoCount: number
  photoSpec: string | null
  videoCount: number
  videoDurationSec: number
  videoResolution: string | null
  managerNote: string | null
  managerName: string
  responseDeadline: string | null
  rejectionReason?: string
}

export type Screen =
  | 'operator-overview'
  | 'customer-overview'
  | 'manager-overview'
  | 'sysop-overview'
  | 'admin-overview'
  | 'mission-list'
  | 'mission-detail'
  | 'accept-reject'
  | 'gcs-connect'
  | 'preflight'
  | 'preflight-failure'
  | 'drone-replacement'
  | 'control-handover'
  | 'ready-to-fly'
  | 'in-flight'
  | 'return-to-base'
  | 'postflight'
  | 'mission-completed'
  | 'mission-failed'
  | 'media-upload'
  | 'manual-upload'
  | 'simulation-zones'
  | 'availability'

export type NavId =
  | 'dashboard'
  | 'my-missions'
  | 'availability'
  | 'mission-control'
  | 'preflight'
  | 'media'
  | 'history'
  | 'zone-map'
  | 'my-requests'
  | 'media-downloads'
  | 'billing'
  | 'support'
  | 'team'
  | 'approvals'
  | 'fleet'
  | 'reports'
  | 'fleet-health'
  | 'maintenance'
  | 'systems'
  | 'sys-alerts'
  | 'users'
  | 'configuration'
  | 'audit'
  | 'integrations'
  | 'notifications'
  | 'profile'

export type ChecklistScenario =
  | 'all-pass'
  | 'battery-fail'
  | 'hardware-fail'
  | 'telemetry-stale'
  | 'weather-warn'
