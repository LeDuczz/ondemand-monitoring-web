import { useI18n } from '../../../../../shared/i18n'
import { ordersApi } from '../../../api/ordersApi'
import { managerHref } from '../../../routes'
import type { OrderDetail } from '../../../types/orders'
import type { SavedAreaReview } from './areaReview'
import { areaManagerReviewMessages } from './AreaManagerReview.messages'

/** The manager's saved area review, or the call to action to make one. */
export function AreaManagerReview({
  order,
  review,
  onEdit,
}: {
  order: OrderDetail
  review: SavedAreaReview | null
  onEdit: () => void
}) {
  const { t, locale } = useI18n(areaManagerReviewMessages)

  async function resolveUnsuitable(
    saved: SavedAreaReview,
    decision: 'NEED_INFO' | 'REJECTED',
  ) {
    const question =
      decision === 'NEED_INFO'
        ? t.confirmAskCustomerChange
        : t.confirmRejectOrder
    if (!window.confirm(question)) return
    const reason = [saved.reason, saved.note].filter(Boolean).join(' — ')
    await ordersApi.submitApproval(order.id, { decision, reason })
    window.location.hash = managerHref({ screen: 'orderQueue' })
  }

  return (
    <div className="odm-or-area-manager-review">
      {review ? (
        <>
          <span>{t.heading}</span>
          <strong className={`is-${review.status.toLowerCase()}`}>
            {t.statusLabels[review.status] ?? review.status}
          </strong>
          {review.reason ? (
            <p>
              <b>{t.reasonLabel}</b> {review.reason}
            </p>
          ) : null}
          {review.note ? (
            <p>
              <b>{t.noteLabel}</b> {review.note}
            </p>
          ) : null}
          <small>
            {review.reviewer ?? t.defaultReviewer}
            {review.reviewedAt
              ? ` · ${new Intl.DateTimeFormat(locale, {
                  dateStyle: 'short',
                  timeStyle: 'short',
                }).format(new Date(review.reviewedAt))}`
              : ''}
          </small>
          <button type="button" className="odm-or-btn-outline" onClick={onEdit}>
            {t.editReview}
          </button>
          {review.status === 'UNSUITABLE' ? (
            <div className="odm-or-area-secondary-actions">
              <button
                type="button"
                onClick={() => void resolveUnsuitable(review, 'NEED_INFO')}
              >
                {t.askCustomerChange}
              </button>
              <button
                type="button"
                className="is-danger"
                onClick={() => void resolveUnsuitable(review, 'REJECTED')}
              >
                {t.rejectOrder}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          <p>{t.noReview}</p>
          <button type="button" className="odm-btn odm-btn-p" onClick={onEdit}>
            {t.reviewArea}
          </button>
          <a href="#portal/manager/support">{t.needHelp}</a>
        </>
      )}
    </div>
  )
}
