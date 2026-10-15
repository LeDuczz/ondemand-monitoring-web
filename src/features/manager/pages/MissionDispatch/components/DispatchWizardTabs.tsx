import { useI18n } from '../../../../../shared/i18n'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { dispatchSteps, type DispatchStep } from '../liveDispatchHelpers'
import { dispatchWizardTabsMessages } from './DispatchWizardTabs.messages'

export function DispatchWizardTabs({
  activeStep,
  onStep,
  selectionOnly = false,
}: {
  activeStep: DispatchStep
  onStep: (step: DispatchStep) => void
  selectionOnly?: boolean
}) {
  const { t } = useI18n(dispatchWizardTabsMessages)
  const activeStepIndex = dispatchSteps.indexOf(activeStep)
  const stepLabels: Record<DispatchStep, string> = {
    order: t.orderTab,
    mission: t.missionTab,
    staff: t.staffTab,
    device: t.deviceTab,
    confirm: t.confirmTab,
  }
  return (
    <nav className="odm-dp-tabs" aria-label={t.tabsAria}>
      {dispatchSteps.map((step, index) => (
        <button
          key={step}
          type="button"
          className={`odm-dp-tab${activeStep === step ? ' is-active' : ''}${
            index < activeStepIndex ? ' is-done' : ''
          }`}
          aria-current={activeStep === step ? 'step' : undefined}
          disabled={
            selectionOnly && ['staff', 'device', 'confirm'].includes(step)
          }
          onClick={() => onStep(step)}
        >
          <span className="odm-dp-tab-dot">
            {index < activeStepIndex ? (
              <OrderIcon name="check" size={12} />
            ) : (
              index + 1
            )}
          </span>
          {stepLabels[step]}
        </button>
      ))}
    </nav>
  )
}
