// Pure sort/count helpers for the MNG-02 order queue. Kept side-effect free
// so they can be unit tested without mounting the page.
import type { AiVerdict } from '../../../shared/types/domain'
import type { OrderQueueItem } from '../types/orders'

export type QueueSortMode = 'feasibleFirst' | 'longestWait' | 'preferredDateAsc'

const verdictRank: Record<AiVerdict, number> = {
  FEASIBLE: 0,
  RISKY: 1,
  INFEASIBLE: 2,
}

function waitMs(now: Date, row: OrderQueueItem): number {
  return now.getTime() - new Date(row.submittedAt).getTime()
}

/**
 * Sorts queue rows. Default (`feasibleFirst`, [BRIEF MNG-02]) puts FEASIBLE
 * rows first, then longest-waiting first within each verdict group.
 * `longestWait` ignores verdict and sorts purely by wait time.
 * `preferredDateAsc` sorts by parsed `dd/MM` preferred date, earliest first.
 */
export function sortQueue(
  rows: OrderQueueItem[],
  mode: QueueSortMode,
  now: Date,
): OrderQueueItem[] {
  const copy = [...rows]
  if (mode === 'longestWait') {
    return copy.sort((a, b) => waitMs(now, b) - waitMs(now, a))
  }
  if (mode === 'preferredDateAsc') {
    return copy.sort(
      (a, b) =>
        parsePreferredDate(a.preferredDate) -
        parsePreferredDate(b.preferredDate),
    )
  }
  return copy.sort((a, b) => {
    const verdictDiff = verdictRank[a.aiVerdict] - verdictRank[b.aiVerdict]
    if (verdictDiff !== 0) return verdictDiff
    return waitMs(now, b) - waitMs(now, a)
  })
}

function parsePreferredDate(value: string): number {
  const [day, month] = value.split('/').map((part) => Number.parseInt(part, 10))
  if (Number.isNaN(day) || Number.isNaN(month)) return Number.MAX_SAFE_INTEGER
  return month * 100 + day
}

/** Counts queue rows by AI verdict, plus `all`. */
export function countByVerdict(
  rows: OrderQueueItem[],
): Record<'all' | AiVerdict, number> {
  const counts: Record<'all' | AiVerdict, number> = {
    all: rows.length,
    FEASIBLE: 0,
    RISKY: 0,
    INFEASIBLE: 0,
  }
  for (const row of rows) counts[row.aiVerdict] += 1
  return counts
}

/** True when a queue row has waited 24h or more since `submittedAt`. */
export function isOverdue(now: Date, row: OrderQueueItem): boolean {
  return waitMs(now, row) >= 24 * 60 * 60 * 1000
}

/** `"N giờ"` / `"N giờ · quá 24h"` wait-time label, per [TK MNG-02]. */
export function formatWaitLabel(now: Date, row: OrderQueueItem): string {
  const hours = Math.floor(waitMs(now, row) / (60 * 60 * 1000))
  return isOverdue(now, row) ? `${hours} giờ · quá 24h` : `${hours} giờ`
}
