import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { CustomerConsultation, ServiceOption } from '../../../api/customerApi'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import type { FormState } from '../../../lib/createOrder/types'
import { consultationSummaryCardMessages } from './ConsultationSummaryCard.messages'
import { Metric } from './Metric'

type Props = {
  form: FormState
  consultation: CustomerConsultation | null
  service?: ServiceOption
  aiAnalysisRequested: boolean
}

export function ConsultationSummaryCard({ form, consultation, service, aiAnalysisRequested }: Props) {
  const { t, lang } = useI18n(consultationSummaryCardMessages)
  const recommended =
    consultation?.recommendedServiceName || consultation?.recommendedServiceId

  if (!recommended) {
    return (
      <section className="co-ai-empty">
        <span className="co-ai-empty-icon" aria-hidden="true">✦</span>
        <div>
          <h2 className="co-ai-empty-title">{t.cardTitle}</h2>
          <p className="co-ai-empty-text">
            <strong>{t.notUsedTitle}</strong>
            <br />
            {t.noConsultation}
          </p>
        </div>
      </section>
    )
  }

  return (
    <Card
      title={t.cardTitle}
      actions={<span className="co-ai-badge">✦ {t.aiBadge}</span>}
    >
      <div className="co-notice is-success">
        <strong className="co-notice-title">{t.recommendedService}</strong>
        {localizeServiceName(
          consultation?.recommendedServiceName || service?.name || recommended,
          lang,
        )}
      </div>
      {consultation?.requirementSummary && (
        <div className="co-block co-pre co-mt">{consultation.requirementSummary}</div>
      )}
      <div className="co-two co-mt">
        <Metric label={t.media} value={t[form.mediaType]} />
        <Metric label={t.resolution} value={form.resolution || '—'} />
        <Metric label={t.quantity} value={Number.isFinite(form.quantity) ? String(form.quantity) : '—'} />
        <Metric label={t.aiAnalysis} value={aiAnalysisRequested ? t.yes : t.no} />
      </div>
    </Card>
  )
}
