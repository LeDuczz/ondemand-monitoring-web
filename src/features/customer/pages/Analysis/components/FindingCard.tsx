import { StatusBadge, type UiTone } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { FindingSeverity } from '../../../../../shared/types/domain'
import type { FindingView } from '../../../lib/analysis/types'
import type { FindingAction } from '../hooks/useAnalysis'
import { findingCardMessages } from './FindingCard.messages'
import { FindingActions } from './FindingActions'

const SEVERITY_TONE: Record<FindingSeverity, UiTone> = {
  BLOCKER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
}

type Props = {
  finding: FindingView
  busy: boolean
  onDecide: (findingId: string, action: FindingAction) => void
}

export function FindingCard({ finding, busy, onDecide }: Props) {
  const { t } = useI18n(findingCardMessages)
  const code = [finding.ruleCode, finding.fieldRef].filter(Boolean).join(' · ')
  return (
    <li className="an-finding">
      <div className="an-finding-head">
        <StatusBadge tone={SEVERITY_TONE[finding.severity]}>
          {t.severity[finding.severity]}
        </StatusBadge>
        {code && <span className="an-code">{code}</span>}
      </div>
      <p className="an-message">{finding.message}</p>
      {finding.evidence.length > 0 && (
        <dl className="an-evidence" aria-label={t.evidence}>
          {finding.evidence.map(({ key, value }) => (
            <div key={key} className="an-evidence-row">
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      )}
      <FindingActions finding={finding} busy={busy} onDecide={onDecide} />
    </li>
  )
}
