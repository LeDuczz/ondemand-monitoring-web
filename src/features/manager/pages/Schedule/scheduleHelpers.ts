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

export type ChipTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

/** Legend order, left to right. */
export const LEGEND_TONES: ChipTone[] = [
  'warning',
  'info',
  'success',
  'danger',
  'neutral',
]

/** Visual [start, end) of a chip in hours, matching MissionBlock's minimum height. */
export function chipSpan(m: {
  scheduledStartAt: string | null
  scheduledEndAt: string | null
}): { start: number; end: number } {
  const start = m.scheduledStartAt
    ? toLocalHours(m.scheduledStartAt)
    : HOUR_START
  const rawEnd = m.scheduledEndAt ? toLocalHours(m.scheduledEndAt) : start
  return { start, end: Math.max(rawEnd, start + 22 / PX_PER_HOUR) }
}

/**
 * Standard calendar overlap layout (display only): items that overlap in time
 * (transitively) form a cluster; each gets a lane, and the cluster's column
 * width is split evenly across its lane count.
 */
export function layoutOverlaps<
  T extends {
    id: string
    scheduledStartAt: string | null
    scheduledEndAt: string | null
  },
>(items: T[]): Map<string, { lane: number; lanes: number }> {
  const spans = items
    .map((item) => ({ id: item.id, ...chipSpan(item) }))
    .sort((a, b) => a.start - b.start || a.end - b.end)
  const result = new Map<string, { lane: number; lanes: number }>()
  let cluster: { id: string; lane: number }[] = []
  let laneEnds: number[] = []
  let clusterEnd = -Infinity
  const flush = () => {
    for (const entry of cluster)
      result.set(entry.id, { lane: entry.lane, lanes: laneEnds.length })
    cluster = []
    laneEnds = []
    clusterEnd = -Infinity
  }
  for (const span of spans) {
    if (span.start >= clusterEnd) flush()
    let lane = laneEnds.findIndex((end) => end <= span.start)
    if (lane === -1) lane = laneEnds.length
    laneEnds[lane] = span.end
    cluster.push({ id: span.id, lane })
    clusterEnd = Math.max(clusterEnd, span.end)
  }
  flush()
  return result
}
