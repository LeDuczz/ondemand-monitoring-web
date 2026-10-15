import { OrderAreaCheck } from './OrderAreaCheck'
import { ReviewStageActions } from './ReviewStageActions'
import type { ReviewStep } from '../reviewSteps'
import type { OrderDetail } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { reviewAreaStageMessages } from './ReviewAreaStage.messages'

export function ReviewAreaStage({
  order,
  goToStep,
}: {
  order: OrderDetail
  goToStep: (step: ReviewStep) => void
}) {
  const { t } = useI18n(reviewAreaStageMessages)

  return (
    <div className="odm-or-review-stage" aria-label={t.monitoringAreaCheck}>
      <OrderAreaCheck order={order} />
      <ReviewStageActions
        step={2}
        onBack={() => goToStep(1)}
        onNext={() => goToStep(3)}
        nextLabel={t.nextApprovalConditions}
      />
    </div>
  )
}
