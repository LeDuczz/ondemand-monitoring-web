export type OperatorMissionStatus =
  'PENDING' | 'ACCEPTED' | 'IN_FLIGHT' | 'COMPLETED' | 'REJECTED'

export type OperatorMission = {
  id: string
  status: OperatorMissionStatus
  title: string
  location: string
  date: string
  startTime: string
  endTime: string
  serviceLabel: string
  droneCode: string | null
  droneName: string | null
  flightStartedAt?: string
  completedAt?: string
  rejectReason?: string
  acceptedAt?: string
  managerNote?: string
  managerName?: string
  respondBy?: string
  radiusMeters?: number
  ceilingMeters?: number
  photoCount?: number
  photoNote?: string
  videoCount?: number
  videoSeconds?: number
  videoResolution?: string
  droneModel?: string
  dronePayload?: string
  droneStation?: string
  droneStationDistanceKm?: number
  droneReadinessPct?: number
  droneHoursSinceMaintenance?: number
}

export type OperatorProfile = {
  id: string
  fullName: string
  email: string
  rank: string
  station: string
  certExpiry: string
}

export type OperatorMissionTab = 'pending' | 'upcoming' | 'history'

export type FlightConnection = {
  status: 'CONNECTING' | 'CONNECTED' | 'FAILED'
  token: string
  gcsId: string
  connectedAt: string
  disconnectReason?: string
}

export type ControlHandover = {
  status: 'CONFIRMED' | 'REVOKED'
  confirmedAt: string
}

export type PreflightItemKey =
  | 'battery'
  | 'gps'
  | 'camera'
  | 'motor'
  | 'compass'
  | 'link'
  | 'payload'
  | 'weather'
  | 'airspace'

export type PreflightItemResult = 'ok' | 'fail'

export type PreflightItem = {
  key: PreflightItemKey
  result: PreflightItemResult
  note?: string
}

export type PreflightRecord = {
  items: PreflightItem[]
  savedAt: string
}

export type MediaFileType = 'PHOTO' | 'VIDEO'

export type MediaFileStatus =
  | 'UPLOADED'
  | 'UPLOADING'
  | 'FAILED'
  | 'PENDING_UPLOAD'

export type MediaFile = {
  id: string
  name: string
  type: MediaFileType
  sizeBytes: number
  progressPct: number
  attempt: number
  maxAttempts: number
  status: MediaFileStatus
  manualTaskCreated?: boolean
}

export type PostflightItemKey =
  | 'battery_ok'
  | 'motor_ok'
  | 'camera_ok'
  | 'gps_ok'
  | 'communication_ok'
  | 'physical_condition_ok'

export type PostflightItem = {
  key: PostflightItemKey
  result: PreflightItemResult
}

export type PostflightRecord = {
  items: PostflightItem[]
  overallOk: boolean
  notes?: string
  savedAt: string
}

export type FaultType =
  | 'MOTOR_VIBRATION'
  | 'SIGNAL_LOSS'
  | 'BATTERY_DEGRADED'
  | 'CAMERA_GIMBAL'
  | 'PHYSICAL_DAMAGE'
  | 'OTHER'

export type MaintenanceSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export type MaintenanceTicket = {
  id: string
  droneCode: string
  missionId: string
  issueType: FaultType
  severity: MaintenanceSeverity
  description: string
  createdAt: string
}
