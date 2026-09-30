import { useI18n } from '../../../../../shared/i18n'
import { FormField } from '../../../../../shared/components/ui'
import type { ZoneType } from '../../../types/operatingConfig'
import type { ZoneFormState } from './zoneForm'
import { zoneModalMessages } from './ZoneModal.messages'
import { ZONE_TYPES, zoneTypeMessages } from './zoneTypes'

type Props = {
  form: ZoneFormState
  errors: Record<string, string>
  onChange: (patch: Partial<ZoneFormState>) => void
}

export function ZoneFormFields({ form, errors, onChange }: Props) {
  const { t } = useI18n(zoneModalMessages)
  const { t: zt } = useI18n(zoneTypeMessages)
  const text = (id: string, key: keyof ZoneFormState, type = 'text', extra = {}) => (
    <input
      id={id}
      className="odm-inp"
      type={type}
      value={form[key]}
      onChange={(e) => onChange({ [key]: e.target.value })}
      {...extra}
    />
  )
  return (
    <>
      <FormField id="adm-nfz-name" label={t.name} required error={errors.name}>
        {text('adm-nfz-name', 'name')}
      </FormField>
      <div className="adm-form-pair">
        <FormField id="adm-nfz-source" label={t.source}>
          {text('adm-nfz-source', 'source')}
        </FormField>
        <FormField id="adm-nfz-type" label={t.zoneTypeLabel}>
          <select
            id="adm-nfz-type"
            className="odm-inp"
            value={form.zoneType}
            onChange={(e) => onChange({ zoneType: e.target.value as ZoneType })}
          >
            {ZONE_TYPES.map((z) => (
              <option key={z} value={z}>
                {zt[z]}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <div className="adm-form-pair">
        <FormField id="adm-nfz-lat" label={t.lat}>
          {text('adm-nfz-lat', 'lat', 'number', { step: '0.0001' })}
        </FormField>
        <FormField id="adm-nfz-lon" label={t.lon}>
          {text('adm-nfz-lon', 'lon', 'number', { step: '0.0001' })}
        </FormField>
      </div>
      <div className="adm-form-pair">
        <FormField id="adm-nfz-radius" label={t.radius}>
          {text('adm-nfz-radius', 'radiusM', 'number')}
        </FormField>
        <FormField id="adm-nfz-alt" label={t.maxAlt}>
          {text('adm-nfz-alt', 'maxAlt', 'number', { placeholder: t.unlimited })}
        </FormField>
      </div>
      <div className="adm-form-pair">
        <FormField id="adm-nfz-from" label={t.effectiveFrom}>
          {text('adm-nfz-from', 'effectiveFrom', 'date')}
        </FormField>
        <FormField id="adm-nfz-to" label={t.effectiveTo}>
          {text('adm-nfz-to', 'effectiveTo', 'date')}
        </FormField>
      </div>
    </>
  )
}
