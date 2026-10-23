import type { MediaNotification } from '../../lib/media/types'

export type DayGroup = {
  /** `YYYY-MM-DD` in local time, or `unknown` when the entry has no date. */
  key: string
  /** Local date of the group; `null` for the undated group. */
  date: Date | null
  items: MediaNotification[]
}

const pad = (n: number) => String(n).padStart(2, '0')
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** Groups an already sorted list under local calendar days, keeping the order. */
export function groupByDay(items: MediaNotification[]): DayGroup[] {
  const groups: DayGroup[] = []
  for (const item of items) {
    const parsed = item.createdAt ? new Date(item.createdAt) : null
    const date = parsed && !Number.isNaN(parsed.getTime()) ? parsed : null
    const key = date ? dayKey(date) : 'unknown'
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.items.push(item)
    else groups.push({ key, date, items: [item] })
  }
  return groups
}

/** Whole local calendar days between `date` and `now` (0 = today, 1 = yesterday). */
export function daysAgo(date: Date, now: Date): number {
  const a = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const b = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((b - a) / 86_400_000)
}
