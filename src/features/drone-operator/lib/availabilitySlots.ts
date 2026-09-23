// Pure helpers for the OPR-03W weekly availability grid.
// A slot key is `${dayIso}T${HH:MM}`, one entry per 30-minute block from
// 06:00 to 18:30 (the grid's last row starts at 18:30 and ends at 19:00).

export type AvailabilityStatus = 'AVAILABLE' | 'BUSY' | 'OFF'

export const SLOT_MINUTES = 30
export const GRID_START_MINUTES = 6 * 60
export const GRID_END_MINUTES = 19 * 60

export function slotTimes(): string[] {
  const times: string[] = []
  for (let m = GRID_START_MINUTES; m < GRID_END_MINUTES; m += SLOT_MINUTES) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0')
    const mm = String(m % 60).padStart(2, '0')
    times.push(`${hh}:${mm}`)
  }
  return times
}

export function slotKey(dayIso: string, time: string): string {
  return `${dayIso}T${time}`
}

/**
 * Merges a status assignment into a slots map for every key in `keys`,
 * returning a new map (keys not touched are preserved as-is).
 */
export function mergeSlots(
  slots: Record<string, AvailabilityStatus>,
  keys: string[],
  status: AvailabilityStatus,
): Record<string, AvailabilityStatus> {
  const next = { ...slots }
  for (const key of keys) {
    next[key] = status
  }
  return next
}

/**
 * Given the grid's ordered (day, time) coordinates and an anchor + current
 * drag cell, returns every slot key in the rectangular range between them
 * (inclusive) — a click-drag select across days/times.
 */
export function rangeSelect(
  days: string[],
  times: string[],
  anchor: { day: string; time: string },
  current: { day: string; time: string },
): string[] {
  const dayFrom = days.indexOf(anchor.day)
  const dayTo = days.indexOf(current.day)
  const timeFrom = times.indexOf(anchor.time)
  const timeTo = times.indexOf(current.time)
  if (dayFrom === -1 || dayTo === -1 || timeFrom === -1 || timeTo === -1) return []

  const [dMin, dMax] = dayFrom <= dayTo ? [dayFrom, dayTo] : [dayTo, dayFrom]
  const [tMin, tMax] = timeFrom <= timeTo ? [timeFrom, timeTo] : [timeTo, timeFrom]

  const keys: string[] = []
  for (let di = dMin; di <= dMax; di++) {
    for (let ti = tMin; ti <= tMax; ti++) {
      keys.push(slotKey(days[di], times[ti]))
    }
  }
  return keys
}
