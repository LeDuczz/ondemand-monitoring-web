import type { OperatorMission, OperatorProfile } from './types'
import { fmtShortDate } from './missionFormat'

export type OperatorKpis = {
  pendingCount: number
  pendingDeadlineLabel: string | null
  todayCount: number
  todayInFlightCount: number
  upcomingWeekCount: number
  certDaysRemaining: number | null
  certExpiryLabel: string | null
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * Computes the OPR-01 header KPI numbers from live mission + profile data.
 * No hard-coded counts: everything is derived from `missions`/`profile`.
 */
export function computeOperatorKpis(
  missions: OperatorMission[],
  profile: OperatorProfile | null,
  now: Date = new Date(),
): OperatorKpis {
  const pending = missions.filter(
    (m) => m.state === 'WAITING_OPERATOR_ACCEPTANCE',
  )
  const earliestDeadline = pending
    .map((m) => m.responseDeadline)
    .filter((d): d is string => Boolean(d))
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0]

  const todayMissions = missions.filter((m) =>
    isSameDay(new Date(m.scheduledAt), now),
  )
  const todayInFlightCount = todayMissions.filter(
    (m) => m.state === 'IN_FLIGHT',
  ).length

  const weekEnd = new Date(now.getTime() + 7 * 86400000)
  const upcomingWeekCount = missions.filter((m) => {
    const scheduled = new Date(m.scheduledAt)
    return (
      scheduled.getTime() >= now.getTime() &&
      scheduled.getTime() <= weekEnd.getTime() &&
      m.state !== 'CANCELLED' &&
      m.state !== 'COMPLETED' &&
      m.state !== 'FAILED'
    )
  }).length

  let certDaysRemaining: number | null = null
  let certExpiryLabel: string | null = null
  if (profile) {
    const diffMs = new Date(profile.certExpiryDate).getTime() - now.getTime()
    certDaysRemaining = Math.max(0, Math.floor(diffMs / 86400000))
    certExpiryLabel = fmtShortDate(profile.certExpiryDate)
  }

  return {
    pendingCount: pending.length,
    pendingDeadlineLabel: earliestDeadline
      ? fmtShortDate(earliestDeadline)
      : null,
    todayCount: todayMissions.length,
    todayInFlightCount,
    upcomingWeekCount,
    certDaysRemaining,
    certExpiryLabel,
  }
}
