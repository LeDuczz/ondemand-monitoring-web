// Pure "age" formatters for the MNG-01 "Cần xử lý ngay" list and the
// "Đang bay" card. The mock JSON stores raw ISO timestamps (see
// src/mocks/data/manager-dashboard.json); every display string below is
// computed relative to a `now` passed in by the caller so it never drifts
// from what the design shows and stays deterministic in tests.

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

function diffMinutes(now: Date, iso: string): number {
  return Math.round((now.getTime() - new Date(iso).getTime()) / MINUTE_MS)
}

/**
 * Order pending-review age, e.g. "31 giờ · quá 24h" once past
 * `overdueHours` (default 24, per [TK MNG-01]), otherwise just "5 giờ".
 */
export function formatOrderAge(
  now: Date,
  submittedAtIso: string,
  overdueHours = 24,
): string {
  const hours = Math.round(
    (now.getTime() - new Date(submittedAtIso).getTime()) / HOUR_MS,
  )
  return hours >= overdueHours
    ? `${hours} giờ · quá ${overdueHours}h`
    : `${hours} giờ`
}

/**
 * Countdown to a mission's scheduled start, e.g. "Còn 2 giờ 28 phút". Past
 * the scheduled time it reads "Trễ X giờ Y phút".
 */
export function formatMissionCountdown(
  now: Date,
  scheduledStartIso: string,
): string {
  const totalMinutes = Math.round(
    (new Date(scheduledStartIso).getTime() - now.getTime()) / MINUTE_MS,
  )
  const late = totalMinutes < 0
  const abs = Math.abs(totalMinutes)
  const hours = Math.floor(abs / 60)
  const minutes = abs % 60
  const label = hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`
  return late ? `Trễ ${label}` : `Còn ${label}`
}

/** Maintenance ticket open duration, e.g. "Mở 6 ngày". */
export function formatTicketAge(now: Date, openedAtIso: string): string {
  const days = Math.floor(
    (now.getTime() - new Date(openedAtIso).getTime()) / DAY_MS,
  )
  return `Mở ${days} ngày`
}

/** Minutes-ago label for recent events, e.g. "42 phút trước". */
export function formatMinutesAgo(now: Date, createdAtIso: string): string {
  return `${diffMinutes(now, createdAtIso)} phút trước`
}

/** In-flight duration label for the action list, e.g. "Bay 58 phút". */
export function formatFlightMinutes(now: Date, startedAtIso: string): string {
  return `Bay ${diffMinutes(now, startedAtIso)} phút`
}

function pad2(value: number): string {
  return value.toString().padStart(2, '0')
}

/**
 * Elapsed/planned progress label for the "Đang bay" card, matching [TK
 * MNG-01] literally: elapsed time as HH:MM (e.g. 58 minutes -> "00:58") over
 * the planned duration shown as raw-minutes:00 (e.g. 90 -> "90:00").
 */
export function formatFlightProgress(
  now: Date,
  startedAtIso: string,
  plannedDurationMin: number,
): string {
  const elapsedMin = Math.max(0, diffMinutes(now, startedAtIso))
  const elapsedHours = Math.floor(elapsedMin / 60)
  const elapsedRemMin = elapsedMin % 60
  return `${pad2(elapsedHours)}:${pad2(elapsedRemMin)} / ${pad2(plannedDurationMin)}:00`
}
