import type { PricingChecklistItem } from '../types'

export type AdjustmentType =
  | 'DISCOUNT'
  | 'PROMOTION'
  | 'COMPENSATION'
  | 'GOODWILL'
  | 'CORRECTION'

export type PricingDraft = {
  packagePrice: string
  discountAmount: string
  adjustmentAmount: string
  managerNote: string
  adjustmentReason: string
  adjustmentType: AdjustmentType
  approvalNote: string
  prices: Record<string, string>
}

export const emptyDraft: PricingDraft = {
  packagePrice: '0',
  discountAmount: '0',
  adjustmentAmount: '0',
  managerNote: '',
  adjustmentReason: '',
  adjustmentType: 'CORRECTION',
  approvalNote: '',
  prices: {},
}

/** The backend wants a meaningful reason (at least 10 characters) whenever the total differs from the system price. */
export const MIN_REASON_LENGTH = 10

export type SystemLine = {
  orderChecklistItemId?: string | null
  amount: number
}

export function amount(value: string | undefined) {
  const parsed = Number(value ?? 0)
  return Number.isSafeInteger(parsed) ? parsed : 0
}

export function digits(value: string) {
  return value.replace(/[^0-9]/g, '').replace(/^0+(?=\d)/, '') || '0'
}

/**
 * What the pricing policy in force charges for this checklist now. The price stored on the item is only what it was when the
 * order was created, so the live calculation wins whenever it covers the item.
 */
export function liveSystemPrice(
  item: PricingChecklistItem,
  lines: SystemLine[] | undefined,
) {
  const mine = (lines ?? []).filter(
    (line) => line.orderChecklistItemId === item.id,
  )
  if (mine.length === 0) return item.systemCalculatedPrice ?? 0
  return mine.reduce((sum, line) => sum + line.amount, 0)
}

/** Items the Manager prices by hand (not the default package, not rejected or duplicate). */
export function isManagerPriced(item: PricingChecklistItem) {
  return (
    item.sourceType !== 'SERVICE_TEMPLATE' &&
    item.reviewStatus !== 'REJECTED' &&
    item.reviewStatus !== 'DUPLICATE' &&
    (item.managerQuoteRequired || item.reviewStatus === 'ADDITIONAL')
  )
}

/** The Manager's starting/approved price per priced item: the typed draft, else what was saved, else the system price. */
export function approvedPrices(
  items: PricingChecklistItem[],
  draft: PricingDraft,
  lines: SystemLine[] | undefined,
) {
  return Object.fromEntries(
    items
      .filter(isManagerPriced)
      .map((item) => [
        item.id,
        draft.prices[item.id] == null
          ? (item.managerApprovedAmount ??
            item.managerQuotedPrice ??
            liveSystemPrice(item, lines))
          : amount(draft.prices[item.id]),
      ]),
  )
}

/** Same bounds the server enforces: the policy's maximum discount and markup on this item's system price. */
export function priceLimits(
  system: number,
  maxDiscountPercent: number | null | undefined,
  maxMarkupPercent: number | null | undefined,
) {
  if (system <= 0 || maxDiscountPercent == null || maxMarkupPercent == null)
    return null
  return {
    min: Math.ceil((system * (100 - maxDiscountPercent)) / 100),
    max: Math.floor((system * (100 + maxMarkupPercent)) / 100),
  }
}
