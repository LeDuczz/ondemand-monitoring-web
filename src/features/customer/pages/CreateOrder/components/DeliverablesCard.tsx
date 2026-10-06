import { Card, FormField } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { ServiceDeliverableOption } from '../../../api/customerApi'
import type {
  FormErrors,
  FormState,
  UpdateField,
} from '../../../lib/createOrder/types'
import { localizeDeliverableName } from '../../../lib/i18n/catalogNames'
import { deliverablesCardMessages } from './DeliverablesCard.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
  deliverables: ServiceDeliverableOption[]
  loading: boolean
}

export function DeliverablesCard({ form, errors, update, deliverables, loading }: Props) {
  const { t, lang } = useI18n(deliverablesCardMessages)
  return (
    <Card title={t.cardTitle}>
      <p className="co-hint co-card-sub">{t.cardSubtitle}</p>
      <FormField id="co-deliv" label={t.deliverableType} required error={errors.deliverableTypeId}>
        <select
          id="co-deliv"
          className="co-input"
          value={form.deliverableTypeId}
          onChange={(e) => update('deliverableTypeId', e.target.value)}
        >
          <option value="">{t.selectDeliverable}</option>
          {deliverables.map((item) => (
            <option key={item.id} value={item.deliverableTypeId}>
              {localizeDeliverableName(item.deliverableTypeName, lang) || item.deliverableTypeId}
            </option>
          ))}
        </select>
      </FormField>
      {loading && <p className="co-hint">{t.loading}</p>}
      {!loading && deliverables.length === 0 && <p className="co-hint">{t.empty}</p>}
      <div className="co-two co-mt">
        <FormField id="co-media" label={t.media}>
          <select
            id="co-media"
            className="co-input"
            value={form.mediaType}
            onChange={(e) => update('mediaType', e.target.value as FormState['mediaType'])}
          >
            <option value="IMAGE">{t.photo}</option>
            <option value="VIDEO">{t.video}</option>
          </select>
        </FormField>
        <FormField
          id="co-qty"
          label={form.mediaType === 'VIDEO' ? t.quantityVideo : t.quantityPhoto}
        >
          <input
            id="co-qty"
            type="number"
            min={1}
            className="co-input"
            value={form.quantity}
            onChange={(e) => update('quantity', Number(e.target.value))}
          />
        </FormField>
      </div>
      <FormField id="co-res" label={t.resolution}>
        <select
          id="co-res"
          className="co-input"
          value={form.resolution}
          onChange={(e) => update('resolution', e.target.value)}
        >
          <option value="1080p">1080p</option>
          <option value="4K">4K</option>
          <option value="20MP">20MP</option>
          <option value="640x512">{t.thermal}</option>
        </select>
      </FormField>
    </Card>
  )
}
