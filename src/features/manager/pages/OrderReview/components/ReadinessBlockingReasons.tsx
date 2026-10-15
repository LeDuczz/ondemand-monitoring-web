import type { OrderReadiness } from '../../../types/readiness'
import { useI18n } from '../../../../../shared/i18n'
import { readinessBlockingReasonsMessages } from './ReadinessBlockingReasons.messages'

export function ReadinessBlockingReasons({
  readiness,
}: {
  readiness: OrderReadiness
}) {
  const { t } = useI18n(readinessBlockingReasonsMessages)

  return !readiness.canApprove && readiness.blockingReasons.length > 0 ? (
    <ul
      className="odm-or-readiness-blocking"
      aria-label={t.reasonItCannotBeApproved}
    >
      {readiness.blockingReasons.map((reason) => (
        <li key={reason}>{reason}</li>
      ))}
    </ul>
  ) : null
}
