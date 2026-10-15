import type { MissionRoutePoint } from '../../types/omss'

export type PlanReasonLabels = {
  start: string
  order: string
  approach: string
  clear: string
  return: string
  cruise: string
}

export function planReasonLabel(
  point: MissionRoutePoint,
  reasons: PlanReasonLabels,
) {
  const reason = point.reason.toUpperCase()
  if (reason === 'START') return reasons.start
  if (reason === 'TARGET') return reasons.order
  if (reason === 'TARGET_APPROACH') return reasons.approach
  if (reason === 'TERRAIN_CLEARANCE') return reasons.clear
  if (reason === 'RETURN') return reasons.return
  return reasons.cruise
}

export function planSpeedLabel(point: MissionRoutePoint) {
  return typeof point.speedMps === 'number' && Number.isFinite(point.speedMps)
    ? `${point.speedMps.toFixed(1)} m/s`
    : '--'
}

export function planHeadingLabel(
  point: MissionRoutePoint,
  nextPoint: MissionRoutePoint | undefined,
  hold: string,
) {
  if (!nextPoint) return hold
  const dx = nextPoint.simX - point.simX
  const dy = nextPoint.simY - point.simY
  if (Math.hypot(dx, dy) < 0.001) return hold
  const headingDeg = (Math.atan2(dx, dy) * 180) / Math.PI
  return `${Math.round((headingDeg + 360) % 360)}°`
}
