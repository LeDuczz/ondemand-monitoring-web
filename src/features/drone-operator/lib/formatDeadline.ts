import type { OperatorMission } from '../types/mission'

function diffParts(ms: number): { days: number; hours: number; minutes: number } {
  const totalMinutes = Math.max(0, Math.round(ms / 60000))
  const days = Math.floor(totalMinutes / (24 * 60))
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
  const minutes = totalMinutes % 60
  return { days, hours, minutes }
}

function countdownLabel(ms: number): string {
  const { days, hours, minutes } = diffParts(ms)
  if (days > 0) return `Còn ${days} ngày ${hours} giờ`
  if (hours > 0) return `Còn ${hours} giờ ${minutes} phút`
  return `Còn ${minutes} phút`
}

/** Human label for the "Thời hạn" column, matching OPR-01W's wording per status. */
export function formatDeadline(mission: OperatorMission, now: Date): string {
  const start = new Date(`${mission.date}T${mission.startTime}:00+07:00`)

  switch (mission.status) {
    case 'PENDING':
      return countdownLabel(start.getTime() - now.getTime())
    case 'ACCEPTED':
      return countdownLabel(start.getTime() - now.getTime())
    case 'IN_FLIGHT': {
      const started = mission.flightStartedAt ? new Date(mission.flightStartedAt) : start
      const minutes = Math.max(0, Math.round((now.getTime() - started.getTime()) / 60000))
      return `Đang bay ${minutes} phút`
    }
    case 'COMPLETED': {
      if (!mission.completedAt) return 'Hoàn thành'
      // Read HH:MM straight out of the ISO string (it always carries +07:00)
      // rather than through Date getters, which resolve in the browser's
      // local timezone and would shift the displayed time.
      const match = /T(\d{2}):(\d{2})/.exec(mission.completedAt)
      return match ? `Hoàn thành ${match[1]}:${match[2]}` : 'Hoàn thành'
    }
    case 'REJECTED':
      return mission.rejectReason ?? 'Bị từ chối'
    default:
      return ''
  }
}
