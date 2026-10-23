import type { ReviewStep } from '../reviewTypes'
import { REVIEW_PAGE_COUNT } from '../reviewHelpers'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { reviewStageActionsMessages } from './ReviewStageActions.messages'

export function ReviewStageActions({
  step,
  onBack,
  onNext,
  nextLabel,
  hint,
  nextDisabled = false,
}: {
  step: ReviewStep
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  hint?: string | null
  nextDisabled?: boolean
}) {
  const { t } = useI18n(reviewStageActionsMessages)
  return (
    <div className="odm-or-review-stage-actions">
      {onBack ? (
        <Button type="button" onClick={onBack}>
          {t.back}
        </Button>
      ) : null}
      <span className="odm-or-review-stage-progress">
        {t.step(step, REVIEW_PAGE_COUNT)}
      </span>
      {hint ? (
        <span className="odm-or-review-stage-hint" role="status">
          {hint}
        </span>
      ) : null}
      {onNext ? (
        <Button
          type="button"
          variant="primary"
          onClick={onNext}
          disabled={nextDisabled}
        >
          {nextLabel ?? t.nextDefault}
        </Button>
      ) : null}
    </div>
  )
}
