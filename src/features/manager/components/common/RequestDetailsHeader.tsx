import { StatusBadge } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { requestDetailsHeaderMessages } from './RequestDetailsHeader.messages'

/** Priority and purpose chips shown in the request card header. */
export function RequestChips({
  priorityLabel,
  purposeLabel,
  urgent,
}: {
  priorityLabel: string | null
  purposeLabel: string | null
  urgent: boolean
}) {
  const { t } = useI18n(requestDetailsHeaderMessages)
  if (!priorityLabel && !purposeLabel) return null
  return (
    <div className="odm-or-req-chips">
      {priorityLabel ? (
        <span title={t.priority}>
          <StatusBadge tone={urgent ? 'danger' : 'neutral'}>
            {priorityLabel}
          </StatusBadge>
        </span>
      ) : null}
      {purposeLabel ? (
        <span title={t.usagePurpose}>
          <StatusBadge tone="info">{purposeLabel}</StatusBadge>
        </span>
      ) : null}
    </div>
  )
}
