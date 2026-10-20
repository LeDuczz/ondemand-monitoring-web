import type { LegalReviewStatus, OrderDetail } from '../../../types/orders'

/** What the manager picks in the review dialog; "change location" is saved as REJECTED and sends the order back. */
export type AreaReviewChoice = LegalReviewStatus | 'CHANGE_LOCATION'

/** Manager's saved judgement about the requested flight area. */
export type SavedAreaReview = {
  status: LegalReviewStatus
  requestedScopeFeasible: boolean | null
  reason: string | null
  note: string | null
  reviewer: string | null
  reviewedAt: string | null
}

/** Choices the manager can pick in the review dialog. */
export const AREA_REVIEW_STATUSES = [
  'NOT_REQUIRED',
  'CHANGE_LOCATION',
  'REJECTED',
] as const satisfies readonly AreaReviewChoice[]

export function areaReviewFromOrder(
  order: OrderDetail,
): SavedAreaReview | null {
  if (!order.legalReviewStatus || order.legalReviewStatus === 'NOT_REVIEWED')
    return null
  const reviewedAt = order.flightAreaReviewedAt
    ? new Date(order.flightAreaReviewedAt).getTime()
    : Number.NaN
  const updatedAt = order.updatedAt
    ? new Date(order.updatedAt).getTime()
    : Number.NaN
  // A customer location correction updates the order after the verdict was
  // recorded. That verdict belongs to the old coordinates and is only history.
  if (
    order.status === 'PENDING' &&
    Number.isFinite(reviewedAt) &&
    Number.isFinite(updatedAt) &&
    updatedAt - reviewedAt > 1_000
  ) {
    return null
  }
  return {
    status: order.legalReviewStatus,
    requestedScopeFeasible: order.requestedScopeFeasible ?? null,
    reason: order.flightAreaReviewReason ?? null,
    note: order.flightAreaReviewNote ?? null,
    reviewer: order.flightAreaReviewedByName ?? null,
    reviewedAt: order.flightAreaReviewedAt ?? null,
  }
}
