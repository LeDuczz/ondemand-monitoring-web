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
  error?: unknown
  onRetry: () => void
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

export function DeliverablesCard({
  form,
  errors,
  update,
  deliverables,
  loading,
  error,
  onRetry,
}: Props) {
  const { t, lang } = useI18n(deliverablesCardMessages)
  async function attachImages(files: FileList | null) {
    if (!files?.length) return
    try {
      const attachments = await Promise.all(
        Array.from(files).map(readImageAttachment),
      )
      const existing = new Map(form.attachments.map((item) => [item.id, item]))
      for (const attachment of attachments)
        existing.set(attachment.id, attachment)
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
      <FormField
        id="co-deliv"
        label={t.deliverableType}
        required
        error={errors.deliverableTypeId}
      >
        <select
          id="co-deliv"
          className="co-input"
          value={form.deliverableTypeId}
          disabled={loading || Boolean(error)}
          onChange={(e) => update('deliverableTypeId', e.target.value)}
        >
          <option value="">{t.selectDeliverable}</option>
          {deliverables.map((item) => (
            <option key={item.id} value={item.deliverableTypeId}>
              {localizeDeliverableName(item.deliverableTypeName, lang) ||
                item.deliverableTypeId}
            </option>
          ))}
        </select>
      </FormField>
      {loading && <p className="co-hint">{t.loading}</p>}
      {!loading && error ? (
        <div className="co-notice is-danger" role="alert">
          <p>{t.loadFailed}</p>
          <button
            type="button"
            className="odm-btn odm-btn-gh"
            onClick={onRetry}
          >
            {t.retry}
          </button>
        </div>
      ) : null}
      {!loading && !error && deliverables.length === 0 ? (
        <p className="co-hint">{t.empty}</p>
      ) : null}
      <div className="co-two co-mt">
        <FormField id="co-media" label={t.media}>
          <select
            id="co-media"
            className="co-input"
            value={form.mediaType}
            onChange={(e) =>
              update('mediaType', e.target.value as FormState['mediaType'])
            }
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
          <input
            id="co-attachments"
            className="co-input"
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => {
              void attachImages(event.target.files)
              event.currentTarget.value = ''
            }}
          />
        </FormField>
        <p className="co-hint">{t.attachmentHint}</p>
        {form.attachments.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
              gap: 10,
              marginTop: 10,
            }}
          >
            {form.attachments.map((attachment) => (
              <div
                key={attachment.id}
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  background: 'var(--surface)',
                }}
              >
                <img
                  src={attachment.dataUrl}
                  alt={attachment.fileName}
                  style={{
                    width: '100%',
                    aspectRatio: '4 / 3',
                    objectFit: 'cover',
                  }}
                />
                <div style={{ padding: 8 }}>
                  <div
                    title={attachment.fileName}
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {attachment.fileName}
                  </div>
                  <button
                    type="button"
                    className="odm-btn odm-btn-gh odm-btn-sm"
                    style={{ marginTop: 6, width: '100%' }}
                    onClick={() => removeAttachment(attachment.id)}
                  >
                    {t.removeAttachment}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
