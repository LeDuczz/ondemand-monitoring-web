import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { OrderDetail } from '../../../types/orders'
import type { OrderReadiness } from '../../../types/readiness'
import { OrderReadinessCard } from './OrderReadinessCard'
import { ReadOnlyScope } from './ReadOnlyScope'
import { ReviewStageActions } from './ReviewStageActions'
import type { ReviewStep } from '../reviewSteps'
import { useI18n } from '../../../../../shared/i18n'
import { reviewReadinessStageMessages } from './ReviewReadinessStage.messages'

export function ReviewReadinessStage({
  order,
  readinessQuery,
  goToStep,
  pendingRequired,
  onDecisionDone,
  readOnly = false,
}: {
  order: OrderDetail
  readinessQuery: UseApiQueryState<OrderReadiness>
  goToStep: (step: ReviewStep) => void
  pendingRequired: number
  onDecisionDone: () => void
  /** A completed stage reopened for viewing: content is not editable. */
  readOnly?: boolean
}) {
  const { t } = useI18n(reviewReadinessStageMessages)

  return (
    <div className="odm-or-review-stage" aria-label={t.approvalConditions}>
      <ReadOnlyScope on={readOnly}>
        <section className="odm-or-review-section">
          <OrderReadinessCard
            orderId={order.id}
            query={readinessQuery}
            editable={order.status === 'PENDING'}
            onDecisionDone={onDecisionDone}
          />
        </section>
      </ReadOnlyScope>
      <ReviewStageActions
        step={3}
        onBack={() => goToStep(2)}
        onNext={() => goToStep(4)}
        nextLabel={t.nextChecklistQuote}
        hint={
          order.status === 'PENDING' && pendingRequired > 0
            ? t.conMucBatBuocChua(pendingRequired)
            : null
        }
      />
    </div>
  )
}
