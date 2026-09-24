// PROPOSED helper for CreateMissionPage (MNG-04): converts an order's
// `preferredDate` ("dd/mm") + `preferredTimeName` ("Sáng"/"Chiều"/"Tối")
// into a concrete scheduled start/end the manager can then edit. The
// "Sáng 07:00–11:00" / "Chiều 13:00–17:00" window labels are copied from
// the design (e.g. evd/design/MNG-02.dc.html rows), but there is no source
// for how a manager narrows a 4-hour customer window down to an exact
// mission start/end — this picks the window's start time and a 90-minute
// default duration (matching the seeded MSN-2609-0153-1 example,
// 08:00–09:30), which is a PROPOSED default, not a sourced rule.
const WINDOW_START_HOUR: Record<string, number> = {
  Sáng: 7,
  Chiều: 13,
  Tối: 18,
}

const DEFAULT_DURATION_MIN = 90

export type PrefilledWindow = {
  scheduledStart: string
  scheduledEnd: string
}

/**
 * `preferredDate` is "dd/mm" with no year (as stored on `OrderQueueItem` /
 * `OrderMissionBrief`); `year` should come from the caller's current time
 * (or a fixed `now` in tests) rather than assumed.
 */
export function prefillWindow(
  preferredDate: string,
  preferredTimeName: string,
  year: number,
): PrefilledWindow | null {
  const match = /^(\d{2})\/(\d{2})$/.exec(preferredDate)
  if (!match) return null
  const [, ddStr, mmStr] = match
  const day = Number(ddStr)
  const month = Number(mmStr)
  const startHour = WINDOW_START_HOUR[preferredTimeName]
  if (startHour === undefined) return null

  const start = new Date(year, month - 1, day, startHour, 0, 0)
  const end = new Date(start.getTime() + DEFAULT_DURATION_MIN * 60_000)

  const toLocalIso = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours(),
    )}:${pad(d.getMinutes())}`
  }

  return {
    scheduledStart: toLocalIso(start),
    scheduledEnd: toLocalIso(end),
  }
}
