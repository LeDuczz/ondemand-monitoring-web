export type OperatorMissionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'IN_FLIGHT'
  | 'COMPLETED'
  | 'REJECTED'

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
