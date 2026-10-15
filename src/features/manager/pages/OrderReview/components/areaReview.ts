import type { FlightAreaReviewStatus, OrderDetail } from '../../../types/orders'

/** Manager's saved judgement about the requested flight area. */
export type SavedAreaReview = {
  status: FlightAreaReviewStatus
  requestedScopeFeasible: boolean | null
  reason: string | null
  note: string | null
  reviewer: string | null
  reviewedAt: string | null
}

/** Statuses the manager can pick in the review dialog. */
export const AREA_REVIEW_STATUSES = [
  'PRELIMINARY_PASS',
  'RESTRICTED',
  'UNSUITABLE',
] as const satisfies readonly FlightAreaReviewStatus[]

export function areaReviewFromOrder(
  order: OrderDetail,
): SavedAreaReview | null {
  if (!order.flightAreaReviewStatus) return null
  return {
    status: order.flightAreaReviewStatus,
    requestedScopeFeasible: order.requestedScopeFeasible ?? null,
    reason: order.flightAreaReviewReason ?? null,
    note: order.flightAreaReviewNote ?? null,
    reviewer: order.flightAreaReviewedByName ?? null,
    reviewedAt: order.flightAreaReviewedAt ?? null,
  }
}
