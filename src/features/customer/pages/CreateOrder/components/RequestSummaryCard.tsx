import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  CustomerConsultation,
  PreferredTimeOption,
  ServiceDeliverableOption,
  ServiceOption,
} from '../../../api/customerApi'
import { formatTimeLabel } from '../../../lib/createOrder/format'
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
  const { t } = useI18n(requestSummaryCardMessages)
  const { form } = p
  const rows: Array<[string, string, boolean?]> = [
    [t.title, form.title || DASH],
    [t.address, form.address || DASH],
    [t.coordinates, `${form.latitude}, ${form.longitude}`, true],
    [t.radius, `${form.radiusM} m · ${calcArea(form.radiusM)} ha`, true],
    [t.service, p.service?.name || DASH],
    [t.addOns, p.aiAnalysisRequested ? t.aiAnalysis : t.none],
    [t.dates, `${form.preferredDateFrom} → ${form.preferredDateTo}`, true],
    [t.timeWindow, p.time ? formatTimeLabel(p.time) : DASH],
    [t.deliverable, p.deliverable?.deliverableTypeName || DASH],
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
