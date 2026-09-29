import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { CustomerConsultation, ServiceOption } from '../../../api/customerApi'
import type { FormState } from '../../../lib/createOrder/types'
import { consultationSummaryCardMessages } from './ConsultationSummaryCard.messages'
import { Metric } from './Metric'

type Props = {
  form: FormState
  consultation: CustomerConsultation | null
  service?: ServiceOption
}

export function ConsultationSummaryCard({ form, consultation, service }: Props) {
  const { t } = useI18n(consultationSummaryCardMessages)
  const recommended =
    consultation?.recommendedServiceName || consultation?.recommendedServiceId
  return (
    <Card title={t.cardTitle}>
      {recommended ? (
        <div className="co-notice is-success">
          <strong className="co-notice-title">{t.recommendedService}</strong>
          {consultation?.recommendedServiceName || service?.name || recommended}
        </div>
      ) : (
        <p className="co-hint">{t.noConsultation}</p>
      )}
      {consultation?.requirementSummary && (
        <div className="co-block co-pre co-mt">{consultation.requirementSummary}</div>
      )}
      <div className="co-two co-mt">
        <Metric label={t.media} value={`${t[form.mediaType]} · ${form.resolution}`} />
        <Metric label={t.quantity} value={String(form.quantity)} />
      </div>
    </Card>
  )
}
