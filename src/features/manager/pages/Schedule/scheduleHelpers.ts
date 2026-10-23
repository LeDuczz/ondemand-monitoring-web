// ── constants ──────────────────────────────────────────────────────────────

/** Hour range shown in the week grid: 06:00 – 22:00 [TK MNG-06]. */
export const HOUR_START = 6

export const HOUR_END = 22

export const TOTAL_HOURS = HOUR_END - HOUR_START

/** Height per hour in px for the time grid. */
export const PX_PER_HOUR = 60

export function formatDateShort(d: Date): string {
  return String(d.getDate())
}

export function formatWeekLabel(start: Date, end: Date): string {
  const fmt = (d: Date) =>
    `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
  return `${fmt(start)} – ${fmt(end)}`
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/** Parses an ISO datetime string and returns local hours as a fraction (e.g. 13:30 → 13.5). */
export function toLocalHours(iso: string): number {
  const d = new Date(iso)
  return d.getHours() + d.getMinutes() / 60
}

/** A mission placed in a day column; overlapping missions get side-by-side lanes. */
export type LaneItem<T> = { item: T; lane: number; lanes: number }

/** Minimum visual duration (hours) so very short missions still collide when stacked. */
const MIN_VISUAL_HOURS = 0.3

/**
 * Greedy lane assignment: missions that overlap in time form a cluster and are
 * laid out in parallel lanes, each cluster sharing the same lane count.
 */
export function layoutLanes<T>(
  entries: Array<{ item: T; start: number; end: number }>,
): Array<LaneItem<T>> {
  const sorted = [...entries].sort((a, b) => a.start - b.start || a.end - b.end)
  const result: Array<LaneItem<T>> = []
  let cluster: Array<{ item: T; lane: number }> = []
  let laneEnds: number[] = []
  let clusterEnd = -Infinity

  const flush = () => {
    const lanes = laneEnds.length
    for (const entry of cluster) result.push({ ...entry, lanes })
    cluster = []
    laneEnds = []
    clusterEnd = -Infinity
  }

  for (const entry of sorted) {
    const end = Math.max(entry.end, entry.start + MIN_VISUAL_HOURS)
    if (cluster.length > 0 && entry.start >= clusterEnd) flush()
    let lane = laneEnds.findIndex((laneEnd) => laneEnd <= entry.start)
    if (lane === -1) {
      lane = laneEnds.length
      laneEnds.push(end)
    } else {
      laneEnds[lane] = end
    }
    cluster.push({ item: entry.item, lane })
    clusterEnd = Math.max(clusterEnd, end)
  }
  flush()
  return result
}
