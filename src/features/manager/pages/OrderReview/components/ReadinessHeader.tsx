import { OrderIcon } from '../../../components/common/OrderIcon'
import { recommendationText } from '../readinessLabels'
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

  return (
    <header className="odm-or-card-head">
      <span className="odm-or-card-title">
        <OrderIcon name="check" size={18} />
        {t.approvalConditions}
      </span>
      <div className="odm-or-readiness-head-actions">
        <span
          className={`odm-or-readiness-verdict is-${readiness.canApprove ? 'ok' : 'blocked'}`}
          role="status"
        >
          {readiness.canApprove
            ? recommendationText[readiness.recommendation]
            : pendingRequired > 0
              ? t.conMucManagerCanXac(pendingRequired)
              : recommendationText[readiness.recommendation]}
        </span>
      </div>
    </header>
  )
}
