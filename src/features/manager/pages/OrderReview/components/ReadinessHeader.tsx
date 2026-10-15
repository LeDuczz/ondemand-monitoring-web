import { readinessLabelsMessages } from '../readinessLabels.messages'
import type { OrderReadiness } from '../../../types/readiness'
import { useI18n } from '../../../../../shared/i18n'
import { readinessHeaderMessages } from './ReadinessHeader.messages'

export function ReadinessHeader({
  readiness,
  pendingRequired,
}: {
  readiness: OrderReadiness
  pendingRequired: number
}) {
  const { t } = useI18n(readinessHeaderMessages)
  const { t: labels } = useI18n(readinessLabelsMessages)

  return (
    <header className="odm-or-card-head">
      <span className="odm-or-card-title">{t.approvalConditions}</span>
      <div className="odm-or-readiness-head-actions">
        <span
          className={`odm-or-readiness-verdict is-${readiness.canApprove ? 'ok' : 'blocked'}`}
          role="status"
        >
          {readiness.canApprove
            ? labels.recommendationText[readiness.recommendation]
            : pendingRequired > 0
              ? t.conMucManagerCanXac(pendingRequired)
              : labels.recommendationText[readiness.recommendation]}
        </span>
      </div>
    </header>
  )
}
