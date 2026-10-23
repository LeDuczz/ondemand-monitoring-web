import type { DispatchStep } from './liveDispatchTypes'
import { useI18n } from '../../../../shared/i18n'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { resourceSteps } from './liveDispatchConstants'
import { OrderIcon } from './OrderIcon'
import '../layout/mgrLayout.css'

/** Compact horizontal stepper for the assignment wizard steps. */
export function DispatchWizardTabs({
  activeStep,
  onStep,
  selectionOnly = false,
}: {
  activeStep: DispatchStep
  onStep: (step: DispatchStep) => void
  selectionOnly?: boolean
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  const activeStepIndex = resourceSteps.indexOf(activeStep)
  const stepLabels: Record<DispatchStep, string> = {
    order: t.orderTab,
    mission: t.missionTab,
    staff: t.staffTab,
    device: t.deviceTab,
    confirm: t.confirmTab,
  }
  return (
    <nav aria-label={t.tabsAria}>
      <ol className="mgr-stepper">
        {resourceSteps.map((step, index) => {
          const state =
            activeStep === step
              ? ' is-current'
              : index < activeStepIndex
                ? ' is-done'
                : ''
          return (
            <li key={step} className={state.trim()}>
              <button
                type="button"
                className="mgr-step-btn"
                aria-current={activeStep === step ? 'step' : undefined}
                disabled={selectionOnly}
                onClick={() => onStep(step)}
              >
                <span className="mgr-step-dot">
                  {index < activeStepIndex ? (
                    <OrderIcon name="check" size={12} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span>{stepLabels[step]}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
