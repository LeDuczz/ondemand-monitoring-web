import { useEffect, useRef, useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { financeApi } from '../api'
import type { ChecklistReviewStatus, PricingChecklistItem } from '../types'
import { managerPricingPanelMessages } from './ManagerPricingPanel.messages'
import {
  MIN_REASON_LENGTH,
  amount,
  approvedPrices,
  emptyDraft,
  isManagerPriced,
  liveSystemPrice,
  priceLimits,
  type PricingDraft,
} from './pricingInput'

export type ChecklistFilter = 'all' | 'pending' | 'reviewed' | 'additional'

/** All state and backend calls of the manager pricing panel. */
export function useManagerPricing({
  orderId,
  onApproved,
  onChecklistReviewChanged,
}: {
  orderId: string
  onApproved?: () => void
  onChecklistReviewChanged?: () => void
}) {
  const { t } = useI18n(managerPricingPanelMessages)
  const query = useApiQuery(
    (signal) => financeApi.getPricingReview(orderId, signal),
    [orderId],
  )
  const [draft, setDraft] = useState<PricingDraft>(emptyDraft)
  const [busy, setBusy] = useState(false)
  const [filter, setFilter] = useState<ChecklistFilter>('all')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [approvalSucceeded, setApprovalSucceeded] = useState(false)
  const dirtyPriceIds = useRef(new Set<string>())
  const initializedQuoteKey = useRef<string | null>(null)

  useEffect(() => {
    setApprovalSucceeded(false)
    dirtyPriceIds.current.clear()
    initializedQuoteKey.current = null
    setDraft(emptyDraft)
  }, [orderId])

  useEffect(() => {
    const quote = query.data?.currentQuote
    if (!query.data) return
    const quoteKey = quote
      ? `${quote.id}:${quote.pricingRevision ?? quote.version}`
      : `new:${orderId}`
    setDraft((state) => {
      const prices = { ...state.prices }
      for (const item of query.data!.checklistItems) {
        if (item.sourceType === 'SERVICE_TEMPLATE') continue
        if (dirtyPriceIds.current.has(item.id)) continue
        prices[item.id] = String(
          item.managerApprovedAmount ??
            item.managerQuotedPrice ??
            liveSystemPrice(item, query.data!.systemCalculation?.items),
        )
      }
      const firstLoad = initializedQuoteKey.current !== quoteKey
      initializedQuoteKey.current = quoteKey
      if (!firstLoad) return { ...state, prices }
      return {
        ...state,
        packagePrice: String(
          quote?.packagePrice ??
            query.data!.systemCalculation?.systemCalculatedAmount ??
            query.data!.basePackagePrice,
        ),
        discountAmount: String(quote?.discountAmount ?? 0),
        adjustmentAmount: '0',
        managerNote: quote?.managerNote ?? '',
        adjustmentReason: quote?.adjustmentReason ?? '',
        adjustmentType: quote?.adjustmentType ?? 'CORRECTION',
        approvalNote: '',
        prices,
      }
    })
  }, [orderId, query.data])

  /** Typing a price marks it dirty so a background reload never overwrites it. */
  function setPrice(itemId: string, value: string) {
    dirtyPriceIds.current.add(itemId)
    setDraft((state) => ({
      ...state,
      prices: { ...state.prices, [itemId]: value },
    }))
  }

  const items = query.data?.checklistItems ?? []
  const lines = query.data?.systemCalculation?.items
  const pendingReviewCount = items.filter(
    (item) =>
      item.sourceType !== 'SERVICE_TEMPLATE' &&
      (!item.reviewStatus || item.reviewStatus === 'PENDING'),
  ).length
  const pendingCustomCount = items.filter(
    (item) =>
      (!item.reviewStatus || item.reviewStatus === 'PENDING') &&
      item.sourceType === 'CUSTOMER_CUSTOM',
  ).length
  const checklistCount = items.length
  const systemPrice =
    query.data?.systemCalculation?.systemCalculatedAmount ??
    amount(draft.packagePrice)
  // Until the draft prices are initialised an item is at its own starting price, i.e. not adjusted.
  const startingPrices = approvedPrices(items, draft, lines)
  const priceRange = (system: number) =>
    priceLimits(
      system,
      query.data?.managerMaxDiscountPercent,
      query.data?.managerMaxMarkupPercent,
    )
  const outOfRangeCount = items.filter((item) => {
    if (!isManagerPriced(item)) return false
    const system = liveSystemPrice(item, lines)
    const range = priceRange(system)
    const price = startingPrices[item.id]
    return (
      range !== null &&
      price !== system &&
      (price < range.min || price > range.max)
    )
  }).length
  const checklistAdjustment = items
    .filter(isManagerPriced)
    .reduce(
      (sum, item) =>
        sum + startingPrices[item.id] - liveSystemPrice(item, lines),
      0,
    )
  const total = systemPrice + checklistAdjustment

  function errorMessage(cause: unknown) {
    if (cause instanceof ApiError) {
      if (cause.code === 'CUSTOM_WORK_PRICING_INCOMPLETE') return cause.message
      const known = cause.code ? t.errors[cause.code] : undefined
      if (known) return known
      if (cause.code === 'PRICING_OVERRIDE_EXCEEDS_LIMIT')
        return cause.message?.trim() || t.errorExceedsLimit
      // Show what the server said (which criterion is missing, which amount is invalid) instead of a generic sentence.
      const detail = cause.message?.trim()
      if (cause.code === 'ORDER_REVIEW_INCOMPLETE')
        return t.errorReviewIncomplete(detail)
      if (cause.code === 'QUOTE_PRICING_INVALID')
        return t.errorPricingInvalid(detail)
      return t.errorUnknown(detail, cause.code)
    }
    return cause instanceof Error ? cause.message : t.genericError
  }

  async function updateReview(
    item: PricingChecklistItem,
    status: ChecklistReviewStatus,
    managerNote = item.managerNote ?? '',
  ) {
    setError(null)
    try {
      await financeApi.reviewChecklist(orderId, item.id, {
        status,
        managerNote: managerNote.trim() || null,
      })
      query.reload()
      onChecklistReviewChanged?.()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  function reasonProblem() {
    const adjusted =
      checklistAdjustment !== 0 || amount(draft.adjustmentAmount) !== 0
    const length = draft.adjustmentReason.trim().length
    if (!adjusted || length >= MIN_REASON_LENGTH) return null
    return length === 0
      ? t.reasonRequired
      : t.reasonTooShort(MIN_REASON_LENGTH, length)
  }

  async function approve() {
    if (!query.data) return
    const problem = reasonProblem()
    if (problem) {
      setMessage(null)
      setError(problem)
      return
    }
    if (outOfRangeCount > 0) {
      setMessage(null)
      setError(t.outOfRange(outOfRangeCount))
      return
    }
    if (pendingCustomCount > 0) {
      setMessage(null)
      setError(t.pendingCustom(pendingCustomCount))
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const quote = await financeApi.saveDraft(orderId, {
        packagePrice: systemPrice,
        discountAmount: 0,
        adjustmentAmount: amount(draft.adjustmentAmount),
        managerNote: draft.managerNote.trim() || null,
        additionalUnitPrices: approvedPrices(items, draft, lines),
        adjustmentReason: draft.adjustmentReason.trim() || null,
        adjustmentType: draft.adjustmentType,
        expectedPricingRevision:
          query.data.currentQuote?.pricingRevision ?? null,
        expectedPolicyVersion:
          query.data.systemCalculation?.policyVersion ?? null,
      })
      dirtyPriceIds.current.clear()
      await financeApi.approveQuote(orderId, quote.id)
      setApprovalSucceeded(true)
      onApproved?.()
      setMessage(t.approveSuccess)
      query.reload()
    } catch (cause) {
      setError(errorMessage(cause))
      if (cause instanceof ApiError && cause.code === 'STALE_PRICING_POLICY') {
        // Show the Manager the prices that now apply; typed prices would be judged against the old ones.
        dirtyPriceIds.current.clear()
        query.reload()
      }
    } finally {
      setBusy(false)
    }
  }

  return {
    query,
    draft,
    setDraft,
    setPrice,
    busy,
    filter,
    setFilter,
    message,
    error,
    approvalSucceeded,
    systemPrice,
    checklistAdjustment,
    total,
    checklistCount,
    pendingReviewCount,
    pendingCustomCount,
    outOfRangeCount,
    priceRange,
    errorMessage,
    updateReview,
    approve,
  }
}
