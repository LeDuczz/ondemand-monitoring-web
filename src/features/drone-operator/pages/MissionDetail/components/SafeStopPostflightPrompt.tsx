import { useI18n } from '../../../../../shared/i18n'
import { safeStopPostflightPromptMessages } from './SafeStopPostflightPrompt.messages'

export function SafeStopPostflightPrompt({
  submitting,
  onPrepare,
}: {
  submitting: boolean
  onPrepare: () => void
}) {
  const { t } = useI18n(safeStopPostflightPromptMessages)

  return (
    <div className="odm-card">
      <p>{t.description}</p>
      <button
        type="button"
        className="odm-btn"
        disabled={submitting}
        onClick={onPrepare}
      >
        {t.prepare}
      </button>
    </div>
  )
}
