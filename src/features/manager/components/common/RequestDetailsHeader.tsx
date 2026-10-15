import { StatusBadge } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { requestDetailsHeaderMessages } from './RequestDetailsHeader.messages'

/** Priority chip shown in the request card header. */
export function RequestChips({
  priorityLabel,
  urgent,
}: {
  priorityLabel: string | null
  urgent: boolean
}) {
  const { t } = useI18n(requestDetailsHeaderMessages)
  if (!priorityLabel) return null
  return (
    <div className="odm-or-req-chips">
      <StatusBadge tone={urgent ? 'danger' : 'neutral'}>
        <span className="odm-or-req-chip-label">{t.priority}:</span>{' '}
        <strong>{priorityLabel}</strong>
      </StatusBadge>
    </div>
  )
}
