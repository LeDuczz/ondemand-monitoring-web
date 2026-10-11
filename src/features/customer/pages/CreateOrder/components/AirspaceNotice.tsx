import { Card, FormField } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { findPermitZone } from '../../../lib/createOrder/airspace'
import type { FormErrors, FormState, PermitStatus, UpdateField } from '../../../lib/createOrder/types'
import { airspaceNoticeMessages } from './AirspaceNotice.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
}

/** Shown only when the monitoring circle touches an airspace area that needs a permit. */
export function AirspaceNotice({ form, errors, update }: Props) {
  const { t, lang } = useI18n(airspaceNoticeMessages)
  const zone = findPermitZone(
    { latitude: Number(form.latitude), longitude: Number(form.longitude) },
    form.radiusM,
  )
  if (!zone) return null

  const zoneName = lang === 'en' ? zone.nameEn : zone.name
  const choose = (status: PermitStatus) => update('permitStatus', status)

  return (
    <Card title={t.title}>
      <div className="co-notice is-warning" role="alert">
        {t.message(zoneName)}
      </div>
      <FormField id="co-permit-status" label={t.question} required error={errors.permitStatus}>
        <div className="co-stack" role="radiogroup" aria-label={t.question}>
          <label>
            <input
              type="radio"
              name="co-permit-status"
              checked={form.permitStatus === 'HAVE_PERMIT'}
              onChange={() => choose('HAVE_PERMIT')}
            />{' '}
            {t.havePermit}
          </label>
          <label>
            <input
              type="radio"
              name="co-permit-status"
              checked={form.permitStatus === 'NEED_SUPPORT'}
              onChange={() => choose('NEED_SUPPORT')}
            />{' '}
            {t.needSupport}
          </label>
        </div>
      </FormField>
      {form.permitStatus === 'HAVE_PERMIT' && (
        <FormField id="co-permit-number" label={t.permitNumberLabel} required error={errors.permitNumber}>
          <input
            id="co-permit-number"
            className="co-input"
            maxLength={80}
            value={form.permitNumber}
            placeholder={t.permitNumberPlaceholder}
            onChange={(e) => update('permitNumber', e.target.value)}
          />
        </FormField>
      )}
      {form.permitStatus === 'NEED_SUPPORT' && <div className="co-help">{t.supportHint}</div>}
    </Card>
  )
}
