import type { OrderDetail } from '../../types/orders'
import { Card } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { orderAttachmentsCardMessages } from './OrderAttachmentsCard.messages'

export function OrderAttachmentsCard({ order }: { order: OrderDetail }) {
  const { t } = useI18n(orderAttachmentsCardMessages)

  const attachments = order.attachments
  return (
    <Card title={t.attachments}>
      {attachments == null ? (
        <p className="odm-or-empty">{t.noAttachmentsData}</p>
      ) : attachments.length === 0 ? (
        <p className="odm-or-empty">{t.noAttachments}</p>
      ) : (
        <ul className="odm-or-attachments">
          {attachments.map((att) => (
            <li key={att.url} className="odm-or-attachment">
              <div className="odm-or-attachment-main">
                <div className="odm-or-attachment-name">{att.name}</div>
                <div className="odm-or-attachment-meta">
                  {att.sizeLabel} · {att.mimeType}
                </div>
              </div>
              <a className="odm-btn odm-btn-sm" href={att.url}>
                {t.download}
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
