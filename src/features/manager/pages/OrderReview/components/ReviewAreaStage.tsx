import { OrderAreaCheck } from './OrderAreaCheck'
import { ReadOnlyScope } from './ReadOnlyScope'
import { ReviewStageActions } from './ReviewStageActions'
import type { ReviewStep } from '../reviewSteps'
import type { LegalReviewStatus, OrderDetail } from '../../../types/orders'
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
  areaReviewStatus: LegalReviewStatus | null
  onReviewSaved: (status: LegalReviewStatus) => void
}) {
  const { t } = useI18n(reviewAreaStageMessages)
  const canContinue =
    areaReviewStatus === 'NOT_REQUIRED' || areaReviewStatus === 'APPROVED'
  const hint =
    areaReviewStatus == null
      ? t.reviewRequired
      : areaReviewStatus === 'REJECTED'
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
