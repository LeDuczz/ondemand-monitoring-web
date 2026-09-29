import { MockDataBadge } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { FindingView } from '../../../lib/analysis/types'
import type { FindingAction } from '../hooks/useAnalysis'
import { findingActionsMessages } from './FindingActions.messages'

type Props = {
  finding: FindingView
  busy: boolean
  onDecide: (findingId: string, action: FindingAction) => void
}

/** Apply / ignore a suggested fix. The BE has no endpoint for it: mock only. */
export function FindingActions({ finding, busy, onDecide }: Props) {
  const { t } = useI18n(findingActionsMessages)
  if (finding.state === 'ACCEPTED') return <p className="an-state is-ok">{t.applied}</p>
  if (finding.state === 'IGNORED') return <p className="an-state">{t.ignored}</p>
  if (finding.state === 'AUTO_FIXED') return <p className="an-state is-ok">{t.autoFixed}</p>
  if (finding.state !== 'PENDING' || !finding.suggestionLabel) return null

  return (
    <div className="an-actions">
      <span className="an-suggestion">{t.suggestion(finding.suggestionLabel)}</span>
      <button
        type="button"
        className="odm-btn odm-btn-p odm-btn-sm"
        disabled={busy}
        onClick={() => onDecide(finding.id, 'apply')}
      >
        {t.apply}
      </button>
      <button
        type="button"
        className="odm-btn odm-btn-gh odm-btn-sm"
        disabled={busy}
        onClick={() => onDecide(finding.id, 'ignore')}
      >
        {t.ignore}
      </button>
      <MockDataBadge />
    </div>
  )
}
