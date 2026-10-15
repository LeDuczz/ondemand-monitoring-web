import type { ReactNode } from 'react'

import { Card, StatusBadge, type UiTone } from '../../../shared/components/ui'
import { useI18n } from '../../../shared/i18n'
import type { Quote } from '../types'
import { ChecklistReview } from './components/ChecklistReview'
import { PriceBreakdown } from './components/PriceBreakdown'
import { QuoteActions } from './components/QuoteActions'
import { managerPricingPanelMessages } from './ManagerPricingPanel.messages'
import { useManagerPricing } from './useManagerPricing'
import '../finance.css'

const quoteTone: Partial<Record<Quote['status'], UiTone>> = {
  DRAFT: 'neutral',
  PENDING_REVIEW: 'warning',
  APPROVED: 'success',
  ACCEPTED_BY_CUSTOMER: 'info',
  REJECTED: 'danger',
}

export function ManagerPricingPanel({
  orderId,
  decisionActions,
  onApproved,
  onChecklistReviewChanged,
  approveBlockedReason,
}: {
  orderId: string
  decisionActions?: ReactNode
  onApproved?: () => void
  onChecklistReviewChanged?: () => void
  /** Why approving is not allowed yet (approval criteria not met); null/undefined = allowed. */
  approveBlockedReason?: string | null
}) {
  const { t } = useI18n(managerPricingPanelMessages)
  const pricing = useManagerPricing({
    orderId,
    onApproved,
    onChecklistReviewChanged,
  })
  const { query, draft } = pricing

  const data = query.data
  const quote = data?.currentQuote
  const approved = pricing.approvalSucceeded || quote?.status === 'APPROVED'
  const accepted = quote?.status === 'ACCEPTED_BY_CUSTOMER'

  // The summary card keeps one stable tree in every state so the decision
  // dialogs inside `decisionActions` survive the pricing data loading.
  return (
    <div className="finance-workspace">
      {data ? (
        <Card
          className="finance-panel"
          title={t.title}
          actions={
            quote ? (
              <StatusBadge tone={quoteTone[quote.status] ?? 'neutral'}>
                v{quote.version} · {quote.status}
              </StatusBadge>
            ) : undefined
          }
        >
          <p className="finance-subtitle">{t.subtitle}</p>
          <ChecklistReview
            items={data.checklistItems}
            filter={pricing.filter}
            onFilterChange={pricing.setFilter}
            prices={draft.prices}
            disabled={accepted}
            onPriceChange={(itemId, value) =>
              pricing.setDraft((state) => ({
                ...state,
                prices: { ...state.prices, [itemId]: value },
              }))
            }
            onReview={(item, status, note) =>
              void pricing.updateReview(item, status, note)
            }
          />
        </Card>
      ) : (
        <Card
          className={`finance-panel finance-fallback${query.loading ? '' : ' finance-error'}`}
        >
          {query.loading ? t.loadingPricing : pricing.errorMessage(query.error)}
        </Card>
      )}
      <div className="finance-sidebar">
        <Card
          className="finance-quote"
          title={data ? t.summaryTitle : undefined}
        >
          <div className="finance-quote-content">
            {data ? (
              <>
                <PriceBreakdown
                  draft={draft}
                  additional={pricing.additional}
                  total={pricing.total}
                  pendingReviewCount={pricing.pendingReviewCount}
                  disabled={accepted}
                  onChange={(patch) =>
                    pricing.setDraft((state) => ({ ...state, ...patch }))
                  }
                />
                <QuoteActions
                  error={pricing.error}
                  message={pricing.message}
                  accepted={accepted}
                  busy={pricing.busy}
                  approved={approved}
                  pendingCustomCount={pricing.pendingCustomCount}
                  approveBlockedReason={approveBlockedReason}
                  onSaveDraft={() => void pricing.saveDraft()}
                  onApprove={() => void pricing.approve()}
                />
              </>
            ) : query.loading ? (
              t.loadingQuote
            ) : null}
          </div>
          {decisionActions}
        </Card>
      </div>
    </div>
  )
}
