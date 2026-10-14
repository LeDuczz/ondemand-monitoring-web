import { useI18n } from '../../../shared/i18n'
import { OrderIcon } from './orderReview/OrderIcon'
import { orderWorkflowStepperMessages } from './OrderWorkflowStepper.messages'
import '../manager.css'

/** 1–8 = active step; 9 = every step completed. */
export type OrderWorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9

/**
 * Read-only 8-step order workflow header, visually identical to the review
 * page stepper: Order info → … → Schedule → Assign resources → Confirm.
 * Steps before `currentStep` render as completed.
 */
export function OrderWorkflowStepper({
  currentStep,
}: {
  currentStep: OrderWorkflowStep
}) {
  const { t } = useI18n(orderWorkflowStepperMessages)

  return (
    <nav
      className="odm-or-card odm-or-review-stepper"
      aria-label={t.ariaLabel}
    >
      <ol>
        {t.steps.map((step, index) => {
          const number = index + 1
          const state =
            number < currentStep
              ? 'done'
              : number === currentStep
                ? 'current'
                : 'todo'
          return (
            <li key={step.label} className={`is-${state}`}>
              <div
                className="odm-or-review-step is-static"
                aria-current={state === 'current' ? 'step' : undefined}
              >
                <span className="odm-or-review-step-dot">
                  {state === 'done' ? (
                    <OrderIcon name="check" size={16} />
                  ) : (
                    number
                  )}
                </span>
                <span className="odm-or-review-step-text">
                  <strong>{step.label}</strong>
                  <small>{step.hint}</small>
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
