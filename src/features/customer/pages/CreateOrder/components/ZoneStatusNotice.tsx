import { useI18n } from '../../../../../shared/i18n'
import type {
  MonitoringValidation,
  RestrictedValidation,
} from '../../../lib/createOrder/geometry'
import { zoneStatusNoticeMessages } from './ZoneStatusNotice.messages'

type Props = {
  monitoring: MonitoringValidation
  restricted: RestrictedValidation
}

/** Green / amber / red summary of the picked point against the zones. */
export function ZoneStatusNotice({ monitoring, restricted }: Props) {
  const { t } = useI18n(zoneStatusNoticeMessages)
  const outside = monitoring.checked && !monitoring.valid

  let tone = 'is-success'
  let title = t.validTitle
  let message = t.validMessage(
    monitoring.zone?.name ? ` ${monitoring.zone.name}` : '',
  )
  if (outside) {
    tone = 'is-warning'
    title = t.outsideTitle
    message = t.outsideMessage
  } else if (!restricted.valid) {
    tone = 'is-danger'
    title = t.blockedTitle
    message = t.blockedMessage(restricted.blockedZones.map((z) => z.name).join(', '))
  }

  return (
    <div className={`co-notice ${tone}`} role="status">
      <strong className="co-notice-title">{title}</strong>
      {message}
    </div>
  )
}
