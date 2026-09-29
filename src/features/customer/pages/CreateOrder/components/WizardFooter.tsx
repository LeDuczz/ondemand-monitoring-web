import { useI18n } from '../../../../../shared/i18n'
import type { Step } from '../../../lib/createOrder/types'
import { wizardFooterMessages } from './WizardFooter.messages'

type Props = {
  step: Step
  nextLabel: string
  submitDisabled: boolean
  onBack: () => void
  onNext: () => void
  onSubmit: () => void
}

export function WizardFooter({ step, nextLabel, submitDisabled, onBack, onNext, onSubmit }: Props) {
  const { t } = useI18n(wizardFooterMessages)
  return (
    <div className="co-footer">
      {step > 1 && (
        <button type="button" className="odm-btn odm-btn-gh" onClick={onBack}>
          {t.back}
        </button>
      )}
      <div className="co-footer-spacer" />
      {step < 4 ? (
        <button type="button" className="odm-btn odm-btn-p" onClick={onNext}>
          {t.continueTo(nextLabel)}
        </button>
      ) : (
        <button type="button" className="odm-btn odm-btn-p" onClick={onSubmit} disabled={submitDisabled}>
          {t.submit}
        </button>
      )}
    </div>
  )
}
