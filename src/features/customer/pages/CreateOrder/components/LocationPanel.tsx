import { Card, FormField } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type {
  MonitoringValidation,
  RestrictedValidation,
} from '../../../lib/createOrder/geometry'
import { calcArea } from '../../../lib/createOrder/payload'
import type {
  FormErrors,
  FormState,
  UpdateField,
} from '../../../lib/createOrder/types'
import { locationPanelMessages } from './LocationPanel.messages'
import { Metric } from './Metric'
import { ZoneStatusNotice } from './ZoneStatusNotice'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  monitoring: MonitoringValidation
  restricted: RestrictedValidation
}

export function LocationPanel({ form, errors, update, monitoring, restricted }: Props) {
  const { t } = useI18n(locationPanelMessages)
  const outside = monitoring.checked && !monitoring.valid

  return (
    <Card title={t.cardTitle}>
      <FormField id="co-address" label={t.addressLabel} required error={errors.address}>
        <textarea
          id="co-address"
          className="co-input"
          rows={3}
          value={form.address}
          placeholder={t.addressPlaceholder}
          onChange={(e) => update('address', e.target.value)}
        />
      </FormField>
      <div className="co-two">
        <FormField id="co-lat" label={t.latitudeLabel} error={errors.latitude}>
          <input
            id="co-lat"
            className="co-input"
            value={form.latitude}
            onChange={(e) => update('latitude', e.target.value)}
          />
        </FormField>
        <FormField id="co-lng" label={t.longitudeLabel} error={errors.longitude}>
          <input
            id="co-lng"
            className="co-input"
            value={form.longitude}
            onChange={(e) => update('longitude', e.target.value)}
          />
        </FormField>
      </div>
      <FormField id="co-radius" label={t.radiusLabel(form.radiusM)}>
        <input
          id="co-radius"
          className="co-range"
          type="range"
          min={100}
          max={1500}
          step={50}
          value={form.radiusM}
          onChange={(e) => update('radiusM', Number(e.target.value))}
        />
      </FormField>
      <ZoneStatusNotice monitoring={monitoring} restricted={restricted} />
      <div className="co-two co-mt">
        <Metric label={t.areaEstimate} value={`${calcArea(form.radiusM)} ha`} />
        <Metric
          label={t.monitoringZone}
          value={outside ? t.outsideZoneValue : (monitoring.zone?.name ?? t.checkedValue)}
        />
      </div>
    </Card>
  )
}
