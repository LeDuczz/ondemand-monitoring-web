import type { OrderStatus } from '../../../../shared/types/domain'
import type { OrderStep, OrderStepKey, OrderStepState, OrderTimelineEvent } from './types'

const HAPPY_PATH: OrderStepKey[] = ['submitted', 'approved', 'inProgress', 'completed']

/** Index of the current happy-path step per status; `HAPPY_PATH.length` means all done. */
const CURRENT_INDEX: Partial<Record<OrderStatus, number>> = {
  SUBMITTED: 1,
  PENDING: 1,
  APPROVED: 2,
  SCHEDULED: 2,
  IN_PROGRESS: 2,
  COMPLETED: HAPPY_PATH.length,
}

/** The timeline event that proves a given step, if the BE returned one. */
function eventFor(key: OrderStepKey, events: OrderTimelineEvent[]): OrderTimelineEvent | undefined {
  switch (key) {
    case 'submitted':
      return events.find((e) => e.kind === 'created')
    case 'approved':
      return events.find((e) => e.kind === 'approved')
    case 'rejected':
      return events.find((e) => e.kind === 'rejected')
    case 'inProgress':
      return events.find((e) => e.kind === 'status' && e.status === 'IN_PROGRESS')
    case 'completed':
      return events.find((e) => e.kind === 'status' && e.status === 'COMPLETED')
    case 'cancelled':
      return events.find((e) => e.kind === 'status' && e.status === 'CANCELLED')
  }
}

function step(key: OrderStepKey, state: OrderStepState, events: OrderTimelineEvent[]): OrderStep {
  const event = eventFor(key, events)
  return { key, state, at: event?.at ?? null, actor: event?.actor ?? null, note: event?.note ?? null }
}

/**
 * Ordered progress steps for an order: submitted, approved, in progress, completed.
 * REJECTED and CANCELLED end the path with a terminal step and nothing upcoming; for those
 * only the steps the events prove are listed. Draft-like statuses have no progress yet.
 * Dates, actors and notes are copied from the events and never invented.
 */
export function buildOrderSteps(status: OrderStatus, events: OrderTimelineEvent[]): OrderStep[] {
  if (status === 'REJECTED') {
    return [step('submitted', 'done', events), step('rejected', 'failed', events)]
  }
  if (status === 'CANCELLED') {
    const reached: OrderStep[] = []
    if (eventFor('submitted', events)) reached.push(step('submitted', 'done', events))
    if (eventFor('approved', events)) reached.push(step('approved', 'done', events))
    return [...reached, step('cancelled', 'cancelled', events)]
  }
  const current = CURRENT_INDEX[status]
  if (current === undefined) return []
  return HAPPY_PATH.map((key, index) =>
    step(key, index < current ? 'done' : index === current ? 'current' : 'upcoming', events),
  )
}
