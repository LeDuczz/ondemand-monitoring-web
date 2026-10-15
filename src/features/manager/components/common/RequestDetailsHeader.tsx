import { OrderIcon } from './OrderIcon'
import { useI18n } from '../../../../shared/i18n'
import { requestDetailsHeaderMessages } from './RequestDetailsHeader.messages'

export function RequestDetailsHeader({
  priorityLabel,
  purposeLabel,
  urgent,
}: {
  priorityLabel: string | null
  purposeLabel: string | null
  urgent: boolean
}) {
  const { t } = useI18n(requestDetailsHeaderMessages)

  return (
    <header className="odm-or-card-head">
      <span className="odm-or-card-title">
        <OrderIcon name="file" size={18} />
        {t.customerRequestDetails}
      </span>
      {priorityLabel || purposeLabel ? (
        <div className="odm-or-req-chips">
          {priorityLabel ? (
            <span
              className={`odm-or-req-chip${urgent ? ' is-urgent' : ''}`}
              title={t.priority}
            >
              {priorityLabel}
            </span>
          ) : null}
          {purposeLabel ? (
            <span className="odm-or-req-chip" title={t.usagePurpose}>
              {purposeLabel}
            </span>
          ) : null}
        </div>
      ) : null}
    </header>
  )
}
