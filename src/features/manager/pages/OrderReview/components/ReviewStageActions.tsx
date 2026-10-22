import type { ReviewStep } from '../reviewTypes'
import { REVIEW_PAGE_COUNT } from '../reviewHelpers'
import { Button } from '../../../../../shared/components/ui'

export function ReviewStageActions({
  step,
  onBack,
  onNext,
  nextLabel = 'Tiếp: Điều kiện duyệt',
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
  return (
    <div className="odm-or-review-stage-actions">
      {onBack ? (
        <Button type="button" onClick={onBack}>
          Quay lại
        </Button>
      ) : null}
      <span className="odm-or-review-stage-progress">
        Bước {step}/{REVIEW_PAGE_COUNT}
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
          {nextLabel}
        </Button>
      ) : null}
    </div>
  )
}
