import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  CustomerConsultation,
  PreferredTimeOption,
  ServiceDeliverableOption,
  ServiceOption,
} from '../../../api/customerApi'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { localizeDeliverableName } from '../../../lib/i18n/catalogNames'
import { localizeTimeslot } from '../../../lib/i18n/timeslots'
import { calcArea } from '../../../lib/createOrder/payload'
import type { FormState } from '../../../lib/createOrder/types'
import { requestSummaryCardMessages } from './RequestSummaryCard.messages'

type Props = {
  form: FormState
  service?: ServiceOption
  time?: PreferredTimeOption
  deliverable?: ServiceDeliverableOption
  consultation: CustomerConsultation | null
  aiAnalysisRequested: boolean
}

const DASH = '—'

/** Read-only summary of everything the customer entered. */
export function RequestSummaryCard(p: Props) {
  const { t, lang } = useI18n(requestSummaryCardMessages)
  const { form } = p
  const rows: Array<[string, string, boolean?]> = [
    [t.title, form.title || DASH],
    [t.address, form.address || DASH],
    [t.coordinates, `${form.latitude}, ${form.longitude}`, true],
    [t.radius, `${form.radiusM} m · ${calcArea(form.radiusM)} ha`, true],
    [t.service, p.service ? localizeServiceName(p.service.id, lang, p.service.name) : DASH],
    [t.addOns, p.aiAnalysisRequested ? t.aiAnalysis : t.none],
    [t.dates, `${form.preferredDateFrom} → ${form.preferredDateTo}`, true],
    [t.timeWindow, p.time ? localizeTimeslot(p.time, lang) : DASH],
    [t.deliverable, localizeDeliverableName(p.deliverable?.deliverableTypeName, lang) || DASH],
    [t.attachments, form.attachments.length ? t.attachmentCount(form.attachments.length) : t.none],
    [t.aiConsultation, p.consultation?.id ? t.consulted : t.notUsed],
  ]
  return (
    <Card title={t.cardTitle}>
      <dl className="co-rows">
        {rows.map(([label, value, mono]) => (
          <div key={label} className="co-contents">
            <dt>{label}</dt>
            <dd className={mono ? 'co-mono' : undefined}>{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
