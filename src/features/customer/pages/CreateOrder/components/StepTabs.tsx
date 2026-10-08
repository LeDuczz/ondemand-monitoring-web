import { Icon } from '../../../../../shared/components/Icon'
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
    <div className="co-steps">
      {/* On phones the dots drop their titles, so the position is also written out. */}
      <p className="co-steps-progress">
        {t.progress(step, STEPS.length)} &middot; <strong>{labels[step]}</strong>
      </p>
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
            <span className="co-tab-num">
              {item < step ? (
                <Icon name="check" width={14} height={14} aria-hidden="true" />
              ) : (
                item
              )}
            </span>
            <span className="co-tab-text">
              <span className="co-tab-title">{labels[item]}</span>
              <span className="co-tab-sub">{t.subtitles[item]}</span>
            </span>
          </button>
        )
      })}
      </nav>
    </div>
  )
}
