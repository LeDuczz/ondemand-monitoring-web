import { ManagerPricingPanel } from '../../../../finance/ManagerPricing'
import { OrderApprovalActions } from './OrderApprovalActions'
import { ReadOnlyScope } from './ReadOnlyScope'
import { ReviewStageActions } from './ReviewStageActions'
import type { ReviewStep } from '../reviewSteps'
import type { Dispatch, SetStateAction } from 'react'
import type { OrderDetail } from '../../../types/orders'
import type { OrderReadiness } from '../../../types/readiness'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { reviewDecisionStageMessages } from './ReviewDecisionStage.messages'

export function ReviewDecisionStage({
  order,
  handleApproved,
  readinessQuery,
  approveBlockedReason,
  setNavigateHome,
  goToStep,
  readOnly = false,
}: {
  order: OrderDetail
  handleApproved: () => void
  readinessQuery: UseApiQueryState<OrderReadiness>
  approveBlockedReason: string | null
  setNavigateHome: Dispatch<SetStateAction<boolean>>
  goToStep: (step: ReviewStep) => void
  /** A completed stage reopened for viewing: content is not editable. */
  readOnly?: boolean
}) {
  const { t } = useI18n(reviewDecisionStageMessages)

  return (
    <div className="odm-or-review-stage" aria-label={t.checklistAndQuote}>
      <ReadOnlyScope on={readOnly}>
        <section className="odm-or-review-section">
          <ManagerPricingPanel
            orderId={order.id}
            onApproved={handleApproved}
            onChecklistReviewChanged={readinessQuery.reload}
            approveBlockedReason={approveBlockedReason}
            decisionActions={
              <OrderApprovalActions
                orderId={order.id}
                orderCode={order.code}
                onApproved={handleApproved}
                onDecisionDone={() => setNavigateHome(true)}
                showApprove={false}
              />
            }
          />
        </section>
      </ReadOnlyScope>
      <ReviewStageActions step={4} onBack={() => goToStep(3)} />
    </div>
  )
}
