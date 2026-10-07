import { Card, FormField } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import {
  DELIVERY_METHODS,
  RESULT_FORMATS,
  RETENTION_DAYS,
  type FormErrors,
  type FormState,
  type UpdateField,
} from '../../../lib/createOrder/types'
import { deliveryOptionsCardMessages } from './DeliveryOptionsCard.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
}

/** Step 5: result formats, delivery method, retention period, terms acceptance. */
export function DeliveryOptionsCard({ form, errors, update }: Props) {
  const { t } = useI18n(deliveryOptionsCardMessages)

  function toggle<T extends string>(list: readonly T[], value: T): T[] {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
  }

  return (
    <Card title={t.cardTitle}>
      <p className="co-hint co-card-sub">{t.cardSubtitle}</p>

      <FormField id="co-result-formats" label={t.formatsLabel} required error={errors.resultFormats}>
        <div className="co-chip-group" role="group" aria-label={t.formatsLabel}>
          {RESULT_FORMATS.map((format) => (
            <label
              key={format}
              className={`co-chip-option${form.resultFormats.includes(format) ? ' is-on' : ''}`}
            >
              <input
                type="checkbox"
                checked={form.resultFormats.includes(format)}
                onChange={() => update('resultFormats', toggle(form.resultFormats, format))}
              />
              <span>{t.formats[format]}</span>
            </label>
          ))}
        </div>
        <p className="co-hint">{t.formatsHint}</p>
      </FormField>

      <FormField id="co-delivery-methods" label={t.methodsLabel} required error={errors.deliveryMethods}>
        <div className="co-chip-group" role="group" aria-label={t.methodsLabel}>
          {DELIVERY_METHODS.map((method) => (
            <label
              key={method}
              className={`co-chip-option${form.deliveryMethods.includes(method) ? ' is-on' : ''}`}
            >
              <input
                type="checkbox"
                checked={form.deliveryMethods.includes(method)}
                onChange={() => update('deliveryMethods', toggle(form.deliveryMethods, method))}
              />
              <span>{t.methods[method]}</span>
            </label>
          ))}
        </div>
      </FormField>

      <FormField id="co-retention" label={t.retentionLabel}>
        <select
          id="co-retention"
          className="co-input"
          value={form.dataRetentionDays}
          onChange={(event) =>
            update('dataRetentionDays', Number(event.target.value) as FormState['dataRetentionDays'])
          }
        >
          {RETENTION_DAYS.map((days) => (
            <option key={days} value={days}>
              {t.days(days)}
            </option>
          ))}
        </select>
        <p className="co-hint">{t.retentionHint}</p>
      </FormField>

      <div className="co-terms">
        <div className="co-block-title">{t.termsHeading}</div>
        <label className="co-check">
          <input
            type="checkbox"
            checked={form.termsAccepted}
            aria-invalid={Boolean(errors.termsAccepted)}
            onChange={(event) => update('termsAccepted', event.target.checked)}
          />
          <span>{t.termsLabel}</span>
        </label>
        {errors.termsAccepted && <div className="ui-field-error">{errors.termsAccepted}</div>}
        <details className="co-terms-details">
          <summary>{t.commitmentsToggle}</summary>
          <ul>
            <li>{t.commitmentUse}</li>
            <li>{t.commitmentRetention(form.dataRetentionDays)}</li>
            <li>{t.commitmentResponsibility}</li>
          </ul>
        </details>
      </div>
    </Card>
  )
}
