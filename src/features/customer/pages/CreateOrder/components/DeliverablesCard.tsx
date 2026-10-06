import { Icon } from '../../../../../shared/components/Icon'
import { Card, FormField } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { ServiceDeliverableOption } from '../../../api/customerApi'
import type {
  CustomerOrderAttachment,
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

function readImageAttachment(file: File): Promise<CustomerOrderAttachment> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('INVALID_IMAGE'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      resolve({
        id: `${file.name}-${file.size}-${file.lastModified}`,
        fileName: file.name,
        contentType: file.type,
        sizeBytes: file.size,
        dataUrl: String(reader.result ?? ''),
      })
    }
    reader.onerror = () => reject(reader.error ?? new Error('READ_FAILED'))
    reader.readAsDataURL(file)
  })
}

export function DeliverablesCard({ form, errors, update, deliverables, loading }: Props) {
  const { t, lang } = useI18n(deliverablesCardMessages)
  async function attachImages(files: FileList | null) {
    if (!files?.length) return
    try {
      const attachments = await Promise.all(Array.from(files).map(readImageAttachment))
      const existing = new Map(form.attachments.map((item) => [item.id, item]))
      for (const attachment of attachments) existing.set(attachment.id, attachment)
      update('attachments', Array.from(existing.values()))
    } catch {
      window.alert(t.invalidImage)
    }
  }

  function removeAttachment(id: string) {
    update(
      'attachments',
      form.attachments.filter((attachment) => attachment.id !== id),
    )
  }

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
        <FormField id="co-qty" label={t.quantity}>
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
      <div className="co-mt">
        <FormField id="co-attachments" label={t.attachments}>
          <div className="co-upload">
            <input
              id="co-attachments"
              className="co-upload-input"
              type="file"
              accept="image/*"
              multiple
              onChange={(event) => {
                void attachImages(event.target.files)
                event.currentTarget.value = ''
              }}
            />
            <label htmlFor="co-attachments" className="co-upload-zone">
              <span className="co-upload-icon" aria-hidden="true">
                <Icon name="arrow-up" width={18} height={18} />
              </span>
              <span className="co-upload-text">
                <span className="co-upload-title">{t.uploadTitle}</span>
                <span className="co-upload-meta">{t.uploadMeta}</span>
              </span>
              <span className="odm-btn odm-btn-gh odm-btn-sm co-upload-btn">{t.chooseImages}</span>
            </label>
          </div>
        </FormField>
        <p className="co-hint">{t.attachmentHint}</p>
        {form.attachments.length > 0 && (
          <ul className="co-attach-list">
            {form.attachments.map((attachment) => (
              <li key={attachment.id} className="co-attach-item">
                <img src={attachment.dataUrl} alt={attachment.fileName} />
                <span className="co-attach-name" title={attachment.fileName}>
                  {attachment.fileName}
                </span>
                <button
                  type="button"
                  className="co-attach-remove"
                  aria-label={t.removeAttachmentNamed(attachment.fileName)}
                  title={t.removeAttachment}
                  onClick={() => removeAttachment(attachment.id)}
                >
                  <Icon name="x" width={14} height={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  )
}
