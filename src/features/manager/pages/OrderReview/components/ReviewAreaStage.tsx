import { OrderAreaCheck } from './OrderAreaCheck'
import { ReadOnlyScope } from './ReadOnlyScope'
import { ReviewStageActions } from './ReviewStageActions'
import type { ReviewStep } from '../reviewSteps'
import type { FlightAreaReviewStatus, OrderDetail } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { reviewAreaStageMessages } from './ReviewAreaStage.messages'

export function ReviewAreaStage({
  order,
  goToStep,
  readOnly = false,
  areaReviewStatus,
  onReviewSaved,
}: {
  order: OrderDetail
  goToStep: (step: ReviewStep) => void
  /** A completed stage reopened for viewing: content is not editable. */
  readOnly?: boolean
  /** The manager's current area judgement; continuing needs a usable one. */
  areaReviewStatus: FlightAreaReviewStatus | null
  onReviewSaved: (status: FlightAreaReviewStatus) => void
}) {
  const { t } = useI18n(reviewAreaStageMessages)
  const canContinue =
    areaReviewStatus === 'PRELIMINARY_PASS' || areaReviewStatus === 'RESTRICTED'
  const hint =
    areaReviewStatus == null
      ? t.reviewRequired
      : areaReviewStatus === 'UNDETERMINED'
        ? t.awaitingVerification
        : areaReviewStatus === 'UNSUITABLE'
          ? t.unsuitableHint
          : null

  return (
    <div className="odm-or-review-stage" aria-label={t.monitoringAreaCheck}>
      <ReadOnlyScope on={readOnly}>
        <OrderAreaCheck order={order} onReviewSaved={onReviewSaved} />
      </ReadOnlyScope>
      <ReviewStageActions
        step={2}
        onBack={() => goToStep(1)}
        onNext={() => goToStep(3)}
        nextLabel={t.nextApprovalConditions}
        nextDisabled={!canContinue}
        hint={hint}
      />
    </div>
  )
}
