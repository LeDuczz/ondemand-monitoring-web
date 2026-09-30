import { useI18n } from '../../../../../shared/i18n'
import { fmtDateTime } from '../../../lib/orderStatus'
import type { OrderDetailView } from '../../../lib/orders/types'
import { reviewNoticeMessages } from './ReviewNotice.messages'

/** Result of the staff review (BE `rejectReason`, `reviewByName`, `reviewAt`). */
export function ReviewNotice({ order }: { order: OrderDetailView }) {
  const { t, locale } = useI18n(reviewNoticeMessages)
  const rejected = order.status === 'REJECTED'
  const reviewed = rejected || (order.status === 'APPROVED' && order.reviewAt)
  if (!reviewed) return null

  const meta = [
    order.reviewByName ? t.by(order.reviewByName) : null,
    order.reviewAt ? fmtDateTime(order.reviewAt, locale) : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className={`od-notice ${rejected ? 'is-danger' : 'is-success'}`} role={rejected ? 'alert' : 'status'}>
      <strong>{rejected ? t.rejected : t.approved}</strong>
      {meta && <span className="od-notice-meta">{meta}</span>}
      {rejected && (
        <p>
          {t.reason}: {order.rejectReason || t.noReason}
        </p>
      )}
    </div>
  )
}
