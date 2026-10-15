import { useEffect, useMemo, useState } from 'react'

import { ApiError } from '../../../shared/api/httpClient'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { financeApi } from '../api'
import type { ChecklistReviewStatus, PricingChecklistItem } from '../types'
import { managerPricingPanelMessages } from './ManagerPricingPanel.messages'
import { amount, emptyDraft, type PricingDraft } from './pricingInput'

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

  useEffect(() => {
    setApprovalSucceeded(false)
  }, [orderId])

  useEffect(() => {
    const quote = query.data?.currentQuote
    if (!query.data) return
    if (!quote) {
      setDraft((state) => ({
        ...state,
        packagePrice: String(query.data!.basePackagePrice),
      }))
      return
    }
    setDraft({
      packagePrice: String(quote.packagePrice),
      discountAmount: String(quote.discountAmount),
      adjustmentAmount: String(quote.adjustmentAmount),
      managerNote: quote.managerNote ?? '',
      prices: Object.fromEntries(
        quote.items
          .filter(
            (item) => item.type === 'ADDITIONAL' && item.orderChecklistItemId,
          )
          .map((item) => [item.orderChecklistItemId!, String(item.unitPrice)]),
      ),
    })
  }, [query.data?.basePackagePrice, query.data?.currentQuote?.id])

  const items = query.data?.checklistItems ?? []
  const additional = useMemo(
    () =>
      (query.data?.checklistItems ?? [])
        .filter((item) => item.reviewStatus === 'ADDITIONAL')
        .reduce((sum, item) => sum + amount(draft.prices[item.id]), 0),
    [draft.prices, query.data?.checklistItems],
  )
  const pendingReviewCount = items.filter(
    (item) => !item.reviewStatus || item.reviewStatus === 'PENDING',
  ).length
  const pendingCustomCount = items.filter(
    (item) =>
      (!item.reviewStatus || item.reviewStatus === 'PENDING') &&
      item.sourceType === 'CUSTOMER_CUSTOM',
  ).length
  const checklistCount = items.length
  const total =
    amount(draft.packagePrice) +
    additional -
    amount(draft.discountAmount) +
    amount(draft.adjustmentAmount)

  function errorMessage(cause: unknown) {
    if (
      cause instanceof ApiError &&
      cause.code === 'ORDER_CHECKLIST_REVIEW_INVALID'
    ) {
      return t.checklistInvalid
    }
    return cause instanceof ApiError || cause instanceof Error
      ? cause.message
      : t.genericError
  }

  function draftBody(checklistItems: PricingChecklistItem[]) {
    return {
      packagePrice: amount(draft.packagePrice),
      discountAmount: amount(draft.discountAmount),
      adjustmentAmount: amount(draft.adjustmentAmount),
      managerNote: draft.managerNote.trim() || null,
      additionalUnitPrices: Object.fromEntries(
        checklistItems
          .filter((item) => item.reviewStatus === 'ADDITIONAL')
          .map((item) => [item.id, amount(draft.prices[item.id])]),
      ),
    }
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

  async function saveDraft() {
    if (!query.data) return null
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const quote = await financeApi.saveDraft(
        orderId,
        draftBody(query.data.checklistItems),
      )
      setMessage(t.draftSaved)
      query.reload()
      return quote
    } catch (cause) {
      setError(errorMessage(cause))
      return null
    } finally {
      setBusy(false)
    }
  }

  async function approve() {
    if (!query.data) return
    if (pendingCustomCount > 0) {
      setMessage(null)
      setError(t.pendingCustom(pendingCustomCount))
      return
    }
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const pendingDefaults = query.data.checklistItems.filter(
        (item) =>
          (!item.reviewStatus || item.reviewStatus === 'PENDING') &&
          item.sourceType === 'SERVICE_TEMPLATE',
      )
      await Promise.all(
        pendingDefaults.map((item) =>
          financeApi.reviewChecklist(orderId, item.id, {
            status: 'INCLUDED',
            managerNote: null,
          }),
        ),
      )
      const quote = await financeApi.saveDraft(
        orderId,
        draftBody(query.data.checklistItems),
      )
      await financeApi.approveQuote(orderId, quote.id)
      setApprovalSucceeded(true)
      onApproved?.()
      setMessage(t.approveSuccess)
      query.reload()
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return {
    query,
    draft,
    setDraft,
    busy,
    filter,
    setFilter,
    message,
    error,
    approvalSucceeded,
    additional,
    total,
    checklistCount,
    pendingReviewCount,
    pendingCustomCount,
    errorMessage,
    updateReview,
    saveDraft,
    approve,
  }
}
