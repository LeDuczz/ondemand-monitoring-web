import { isOverdue } from '../../lib/queue'
import type { OrderCreateResponse } from '../../types/orders'

export type QueueFilter = 'ALL' | 'OVERDUE' | 'SOON'

export const QUEUE_FILTERS: QueueFilter[] = ['ALL', 'OVERDUE', 'SOON']

const SOON_MS = 48 * 60 * 60 * 1000

/** True when the preferred start is within the next 48h (or already past). */
export function isScheduledSoon(now: Date, row: OrderCreateResponse): boolean {
  return new Date(row.preferredDateFrom).getTime() - now.getTime() <= SOON_MS
}

export function matchesQueueFilter(
  row: OrderCreateResponse,
  filter: QueueFilter,
  now: Date,
): boolean {
  if (filter === 'OVERDUE') return isOverdue(now, row)
  if (filter === 'SOON') return isScheduledSoon(now, row)
  return true
}
