// Pure calendar helpers for MNG-06 week view. The week is Mon–Sun per
// the design (evd/design/MNG-06.dc.html shows "T2 21 T3 22 … CN 27").

/**
 * Returns the Monday–Sunday week containing `date` together with an ordered
 * 7-element `days` array (Mon … Sun).
 *
 * Implementation: find the Monday by subtracting `(weekday + 6) % 7` days.
 * JS `getDay()` returns 0 = Sunday … 6 = Saturday; the formula maps:
 *   Mon(1) → 0, Tue(2) → 1, … Sun(0) → 6.
 */
export type CalendarWeek = {
  weekStart: Date
  weekEnd: Date
  days: Date[]
}

export function formatCalendarWeek(date: Date): CalendarWeek {
  // Clone to avoid mutating the caller's value.
  const d = new Date(date)
  // Normalise to midnight local time so arithmetic is day-level.
  d.setHours(0, 0, 0, 0)

  const jsDay = d.getDay() // 0 = Sun, 1 = Mon … 6 = Sat
  const daysFromMonday = (jsDay + 6) % 7 // Mon → 0, … Sun → 6

  const weekStart = new Date(d)
  weekStart.setDate(d.getDate() - daysFromMonday)

  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)

  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(weekStart)
    day.setDate(weekStart.getDate() + i)
    return day
  })

  return { weekStart, weekEnd, days }
}

/**
 * Returns the Monday–Sunday week following the week of `date`.
 * Convenience for the "next week" navigation button in MNG-06.
 */
export function nextWeek(date: Date): Date {
  const next = new Date(date)
  next.setDate(date.getDate() + 7)
  return next
}

/**
 * Returns the Monday–Sunday week preceding the week of `date`.
 * Convenience for the "previous week" navigation button in MNG-06.
 */
export function prevWeek(date: Date): Date {
  const prev = new Date(date)
  prev.setDate(date.getDate() - 7)
  return prev
}

/** ISO date string "YYYY-MM-DD" for a Date, using local time. */
export function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
