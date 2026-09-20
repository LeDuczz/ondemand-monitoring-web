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
