import { missionsByTab } from './filterMissions'
import type { OperatorMission, OperatorProfile } from '../types/mission'

export type OperatorKpis = {
  pendingCount: number
  pendingDeadlineLabel: string | null
  todayCount: number
  todayFlyingCount: number
  upcomingWeekCount: number
  certDaysLeft: number
  certExpiryLabel: string
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function toDdMm(dateStr: string): string {
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

export function computeKpis(
  missions: OperatorMission[],
  profile: OperatorProfile,
  now: Date,
): OperatorKpis {
  const pending = missionsByTab(missions, 'pending', now)
  const upcoming = missionsByTab(missions, 'upcoming', now)

  const todayStr = dateKey(now)
  const today = upcoming.filter((m) => m.date === todayStr)
  const todayFlying = today.filter((m) => m.status === 'IN_FLIGHT')

  const earliestPending = [...pending].sort((a, b) => a.date.localeCompare(b.date))[0]

  const certExpiry = profile.certExpiry ? new Date(`${profile.certExpiry}T00:00:00+07:00`) : null
  const msPerDay = 24 * 60 * 60 * 1000
  const certDaysLeft = Math.max(
    0,
    certExpiry ? Math.ceil((certExpiry.getTime() - now.getTime()) / msPerDay) : 0,
  )

  return {
    pendingCount: pending.length,
    pendingDeadlineLabel: earliestPending ? toDdMm(earliestPending.date) : null,
    todayCount: today.length,
    todayFlyingCount: todayFlying.length,
    upcomingWeekCount: upcoming.length,
    certDaysLeft,
    certExpiryLabel: profile.certExpiry ? toDdMm(profile.certExpiry) : '—',
  }
}
