import { useI18n } from '../../../shared/i18n'
import { OrderIcon } from './orderReview/OrderIcon'
import { orderWorkflowStepperMessages } from './OrderWorkflowStepper.messages'
import '../manager.css'

/** 1–4 = active step; 5 = every step completed. */
export type OrderWorkflowStep = 1 | 2 | 3 | 4 | 5

/**
 * Reusable 4-step order workflow header: Review → Schedule → Assign
 * resources → Confirm. Steps before `currentStep` render as completed.
 */
export function OrderWorkflowStepper({
  currentStep,
}: {
  currentStep: OrderWorkflowStep
}) {
  const { t } = useI18n(orderWorkflowStepperMessages)

  return (
    <nav className="odm-or-card odm-or-stepper" aria-label={t.ariaLabel}>
      <ol className="odm-or-stepper-list">
        {t.steps.map((step, index) => {
          const number = index + 1
          const state =
            number < currentStep
              ? 'done'
              : number === currentStep
                ? 'current'
                : 'todo'
          return (
            <li
              key={step.label}
              className={`odm-or-step odm-or-step-${state}`}
              aria-current={state === 'current' ? 'step' : undefined}
            >
              <span className="odm-or-step-dot">
                {state === 'done' ? <OrderIcon name="check" size={16} /> : number}
              </span>
              <span className="odm-or-step-text">
                <span className="odm-or-step-label">{step.label}</span>
                <span className="odm-or-step-hint">{step.hint}</span>
              </span>
              {number < 4 ? (
                <span className="odm-or-step-chevron">
                  <OrderIcon name="chevron-right" size={16} />
                </span>
              ) : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
