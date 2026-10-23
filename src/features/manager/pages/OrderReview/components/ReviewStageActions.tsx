import { useContext } from 'react'
import { createPortal } from 'react-dom'

import type { ReviewStep } from '../reviewTypes'
import { REVIEW_PAGE_COUNT } from '../reviewHelpers'
import { Button, Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { orderReviewPageMessages } from '../OrderReviewPage.messages'
import { reviewStageActionsMessages } from './ReviewStageActions.messages'
import { ReviewActionsSlot } from './ReviewActionsSlot'

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
  const { t: page } = useI18n(orderReviewPageMessages)
  const slot = useContext(ReviewActionsSlot)
  const body = (
    <>
      <span className="odm-or-review-stage-progress">
        {t.step(step, REVIEW_PAGE_COUNT)}
      </span>
      {hint ? (
        <span className="odm-or-review-stage-hint" role="status">
          {hint}
        </span>
      ) : null}
      <div className="mgr-actions">
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
        {onBack ? (
          <Button type="button" onClick={onBack}>
            {t.back}
          </Button>
        ) : null}
      </div>
    </>
  )
  // Inside the review layout the actions live in the sticky sidebar.
  if (slot === undefined) {
    return <div className="odm-or-review-stage-actions">{body}</div>
  }
  if (slot === null) return null
  return createPortal(
    <Card title={page.stageActionsTitle} className="mgr-stage-actions">
      {body}
    </Card>,
    slot,
  )
}
