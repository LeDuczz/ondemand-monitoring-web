import type { OperatorMission } from '../../types/mission'

export const ACTIVE_RAIL_STATUSES = new Set([
  'CONNECTED',
  'PREFLIGHT_CHECKING',
  'FAILED_PREFLIGHT',
  'READY_TO_FLY',
  'IN_FLIGHT',
  'IN_PROGRESS',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'PENDING_REVIEW',
])

export function latestMissionStatus(mission: OperatorMission) {
  return mission.backendStatus ?? mission.status
}

export function isRailMission(
  mission: OperatorMission,
  start: Date,
  now: Date,
) {
  const status = latestMissionStatus(mission)
  if (ACTIVE_RAIL_STATUSES.has(status)) return true
  if (status === 'COMPLETED' || mission.status === 'COMPLETED') return false
  if (mission.status !== 'ACCEPTED' && status !== 'SCHEDULED') return false
  return start.getTime() > now.getTime()
}

export function railMissionPriority(status: string) {
  if (ACTIVE_RAIL_STATUSES.has(status)) return 0
  return 1
}

export function railStatusTone(status: string) {
  if (status === 'PENDING_REVIEW' || status === 'READY_TO_FLY') return 'blue'
  if (status === 'FAILED_PREFLIGHT') return 'red'
  if (
    status === 'IN_FLIGHT' ||
    status === 'IN_PROGRESS' ||
    status === 'RETURNING' ||
    status === 'POSTFLIGHT_CHECKING' ||
    status === 'PREFLIGHT_CHECKING'
  )
    return 'yellow'
  return 'green'
}
