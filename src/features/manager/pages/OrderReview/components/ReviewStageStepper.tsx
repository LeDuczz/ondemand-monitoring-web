import { type ReviewStep, REVIEW_STEPS } from '../reviewSteps'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { useI18n } from '../../../../../shared/i18n'
import { reviewStageStepperMessages } from './ReviewStageStepper.messages'

export function ReviewStageStepper({
  currentStep,
  onChange,
}: {
  currentStep: ReviewStep
  onChange: (step: ReviewStep) => void
}) {
  const { t } = useI18n(reviewStageStepperMessages)

  return (
    <nav
      className="odm-or-card odm-or-review-stepper"
      aria-label={t.orderReviewSteps}
    >
      <ol>
        {REVIEW_STEPS.map((step) => {
          const state = !step.reviewStep
            ? 'locked'
            : step.number < currentStep
              ? 'done'
              : step.number === currentStep
                ? 'current'
                : 'todo'
          return (
            <li key={step.number} className={`is-${state}`}>
              <button
                type="button"
                className="odm-or-review-step"
                aria-current={state === 'current' ? 'step' : undefined}
                disabled={!step.reviewStep}
                title={!step.reviewStep ? t.finishTheOrderReviewTo : undefined}
                onClick={() => step.reviewStep && onChange(step.reviewStep)}
              >
                <span className="odm-or-review-step-dot">
                  {state === 'done' ? (
                    <OrderIcon name="check" size={16} />
                  ) : (
                    step.number
                  )}
                </span>
                <span className="odm-or-review-step-text">
                  <strong>{step.label}</strong>
                  <small>{step.hint}</small>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
