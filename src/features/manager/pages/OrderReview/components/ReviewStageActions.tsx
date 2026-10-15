import { type ReviewStep, REVIEW_STEPS } from '../reviewSteps'
import { useI18n } from '../../../../../shared/i18n'
import { reviewStageActionsMessages } from './ReviewStageActions.messages'

export function ReviewStageActions({
  step,
  onBack,
  onNext,
  nextLabel,
  hint,
}: {
  step: ReviewStep
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  hint?: string | null
}) {
  const { t } = useI18n(reviewStageActionsMessages)

  return (
    <div className="odm-or-review-stage-actions">
      {onBack ? (
        <button type="button" className="odm-btn" onClick={onBack}>
          {t.back}
        </button>
      ) : null}
      <span className="odm-or-review-stage-progress">
        {t.step}
        {step}/{REVIEW_STEPS.length}
      </span>
      {hint ? (
        <span className="odm-or-review-stage-hint" role="status">
          {hint}
        </span>
      ) : null}
      {onNext ? (
        <button type="button" className="odm-btn odm-btn-p" onClick={onNext}>
          {nextLabel ?? t.nextApprovalConditions}
        </button>
      ) : null}
    </div>
  )
}
