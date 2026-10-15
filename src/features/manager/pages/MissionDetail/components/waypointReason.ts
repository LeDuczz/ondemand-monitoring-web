import { getLanguage } from '../../../../../shared/i18n'
import { waypointReasonMessages } from './waypointReason.messages'

export function waypointReasonLabel(value?: string | null): string {
  const t = waypointReasonMessages[getLanguage()]
  if (!value) return t.flightPoint
  if (value === 'START') return t.startingPoint
  if (value === 'TARGET' || value === 'TARGET_APPROACH')
    return t.approachToTarget
  if (value === 'CRUISE') return t.intermediatePoint
  if (value === 'TERRAIN_CLEARANCE') return t.terrainClearance
  if (value === 'OBSTACLE_AVOIDANCE') return t.obstacleAvoidance
  return value.replaceAll('_', ' ').toLowerCase()
}
