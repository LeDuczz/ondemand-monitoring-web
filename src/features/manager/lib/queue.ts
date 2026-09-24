// Pure sort/count helpers for the MNG-02 order queue. Kept side-effect free
// so they can be unit tested without mounting the page.
//
// [BE] `OrderCreateResponse` has no `aiVerdict`/`blockerCount`/`warningCount`
// fields (those were a PROPOSED feature never backed by an endpoint), so the
// verdict-based `feasibleFirst` sort mode and `countByVerdict` helper were
// removed along with them. Wait time is now measured from `createdAt` and
// the preferred-date sort parses the ISO `preferredDateFrom` timestamp.
import type { OrderCreateResponse } from '../types/orders'

export type QueueSortMode = 'longestWait' | 'preferredDateAsc'

function waitMs(now: Date, row: OrderCreateResponse): number {
  return now.getTime() - new Date(row.createdAt).getTime()
}

/**
 * Sorts queue rows. `longestWait` (default) sorts purely by wait time,
 * longest-waiting first. `preferredDateAsc` sorts by `preferredDateFrom`,
 * earliest first.
 */
export function sortQueue(
  rows: OrderCreateResponse[],
  mode: QueueSortMode,
  now: Date,
): OrderCreateResponse[] {
  const copy = [...rows]
  if (mode === 'preferredDateAsc') {
    return copy.sort(
      (a, b) =>
        new Date(a.preferredDateFrom).getTime() -
        new Date(b.preferredDateFrom).getTime(),
    )
  }
  return copy.sort((a, b) => waitMs(now, b) - waitMs(now, a))
}

/** True when a queue row has waited 24h or more since `createdAt`. */
export function isOverdue(now: Date, row: OrderCreateResponse): boolean {
  return waitMs(now, row) >= 24 * 60 * 60 * 1000
}

/** `"N giờ"` / `"N giờ · quá 24h"` wait-time label, per [TK MNG-02]. */
export function formatWaitLabel(now: Date, row: OrderCreateResponse): string {
  const hours = Math.floor(waitMs(now, row) / (60 * 60 * 1000))
  return isOverdue(now, row) ? `${hours} giờ · quá 24h` : `${hours} giờ`
}
