import { Card, FormField } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { CustomerConsultation, ServiceOption } from '../../../api/customerApi'
import { consultationStatusKey } from '../../../lib/createOrder/consultation'
import type { FormErrors, FormState, UpdateField } from '../../../lib/createOrder/types'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { AttachmentsField } from './AttachmentsField'
import { Metric } from './Metric'
import { requestInfoPanelMessages } from './RequestInfoPanel.messages'

const DESCRIPTION_MAX = 2000

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  consultation: CustomerConsultation | null
  recommended?: ServiceOption
  selected?: ServiceOption
}

export function RequestInfoPanel({ form, errors, update, consultation, recommended, selected }: Props) {
  const { t, lang } = useI18n(requestInfoPanelMessages)
  const waiting = consultation?.status === 'READY_FOR_CONFIRMATION' && !selected
  const status = waiting
    ? t.waitingForService
    : t.status[consultationStatusKey(consultation?.status)]

  return (
    <Card title={t.cardTitle}>
      <FormField id="co-title" label={t.titleLabel} required error={errors.title}>
        <input
          id="co-title"
          className="co-input"
          value={form.title}
          placeholder={t.titlePlaceholder}
          onChange={(e) => update('title', e.target.value)}
        />
      </FormField>
      <div className="co-ai-insight">
        <div className="co-ai-insight-title">
          <span aria-hidden="true">✦</span> {t.understood}
        </div>
        <div className="co-pre">{consultation?.requirementSummary || t.noSummary}</div>
      </div>
      <div className="co-two co-mt co-compact">
        <Metric
          label={t.aiSuggested}
          value={
            recommended
              ? localizeServiceName(recommended.id, lang, recommended.name)
              : localizeServiceName(consultation?.recommendedServiceName, lang) || t.noSuggestion
          }
        />
        <Metric label={t.selectedService} value={
            selected ? localizeServiceName(selected.id, lang, selected.name) : t.notSelected
          } />
      </div>
      <div className="co-mt">
        <Metric label={t.consultationStatus} value={status} />
      </div>
      <div className="co-mt">
        <FormField id="co-desc" label={t.descriptionLabel}>
          <textarea
            id="co-desc"
            className="co-input"
            rows={5}
            maxLength={DESCRIPTION_MAX}
            value={form.description}
            placeholder={t.descriptionPlaceholder}
            onChange={(e) => update('description', e.target.value)}
          />
        </FormField>
        <div className="co-counter">
          {form.description.length} / {DESCRIPTION_MAX}
        </div>
      </div>
      <div className="co-mt">
        <AttachmentsField attachments={form.attachments} update={update} />
      </div>
    </Card>
  )
}
