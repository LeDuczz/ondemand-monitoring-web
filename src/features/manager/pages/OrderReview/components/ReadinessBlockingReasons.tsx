import type { OrderReadiness } from '../../../types/readiness'
import { useI18n } from '../../../../../shared/i18n'
import { readinessBlockingReasonsMessages } from './ReadinessBlockingReasons.messages'

export function ReadinessBlockingReasons({
  readiness,
  canDecide = false,
  busy = false,
  onDecision,
}: {
  readiness: OrderReadiness
  /** A required criterion failed: offer request-info / reject. */
  canDecide?: boolean
  busy?: boolean
  onDecision?: (decision: 'NEED_INFO' | 'REJECTED') => void
}) {
  const { t } = useI18n(readinessBlockingReasonsMessages)

  return !readiness.canApprove && readiness.blockingReasons.length > 0 ? (
    <div
      className="odm-or-readiness-blocking"
      aria-label={t.reasonItCannotBeApproved}
    >
      <ul>
        {readiness.blockingReasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
      {canDecide ? (
        <div className="odm-or-readiness-blocking-actions">
          <button
            type="button"
            className="odm-btn odm-btn-ok"
            disabled={busy}
            onClick={() => onDecision?.('NEED_INFO')}
          >
            {t.requestInfo}
          </button>
          <button
            type="button"
            className="odm-btn odm-btn-rd"
            disabled={busy}
            onClick={() => onDecision?.('REJECTED')}
          >
            {t.rejectOrder}
          </button>
        </div>
      ) : null}
    </div>
  ) : null
}
