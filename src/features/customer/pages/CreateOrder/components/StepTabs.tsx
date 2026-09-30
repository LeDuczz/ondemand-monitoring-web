import { useI18n } from '../../../../../shared/i18n'
import { STEPS, type Step } from '../../../lib/createOrder/types'
import { stepTabsMessages } from './StepTabs.messages'

type Props = {
  step: Step
  labels: Record<Step, string>
  onSelect: (step: Step) => void
}

/** Wizard progress; finished steps are clickable to go back. */
export function StepTabs({ step, labels, onSelect }: Props) {
  const { t } = useI18n(stepTabsMessages)
  return (
    <nav className="co-tabs" aria-label={t.ariaLabel}>
      {STEPS.map((item) => {
        const state = item === step ? 'is-active' : item < step ? 'is-done' : ''
        return (
          <button
            key={item}
            type="button"
            className={`co-tab ${state}`}
            aria-current={item === step ? 'step' : undefined}
            disabled={item > step}
            onClick={() => onSelect(item)}
          >
            <span className="co-tab-num">{item}</span>
            {labels[item]}
          </button>
        )
      })}
    </nav>
  )
}
