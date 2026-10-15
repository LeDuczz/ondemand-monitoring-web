import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { OrderDetail } from '../../../types/orders'
import type { OrderReadiness } from '../../../types/readiness'
import { OrderReadinessCard } from './OrderReadinessCard'
import { ReviewStageActions } from './ReviewStageActions'
import type { ReviewStep } from '../reviewSteps'
import { useI18n } from '../../../../../shared/i18n'
import { reviewReadinessStageMessages } from './ReviewReadinessStage.messages'

export function ReviewReadinessStage({
  order,
  readinessQuery,
  goToStep,
  pendingRequired,
}: {
  order: OrderDetail
  readinessQuery: UseApiQueryState<OrderReadiness>
  goToStep: (step: ReviewStep) => void
  pendingRequired: number
}) {
  const { t } = useI18n(reviewReadinessStageMessages)

  return (
    <div className="odm-or-review-stage" aria-label={t.approvalConditions}>
      <section className="odm-or-review-section">
        <OrderReadinessCard
          orderId={order.id}
          query={readinessQuery}
          editable={order.status === 'PENDING'}
        />
      </section>
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
