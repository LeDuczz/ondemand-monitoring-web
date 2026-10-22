import type { OrderDetail } from '../../../types/orders'
import type { SavedAreaReview } from '../areaTypes'
import { usePlanningConfirmation } from '../../../components/common/usePlanningConfirmation'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { areaReviewLabel, resolveUnsuitable } from '../areaHelpers'
import { Button, useToast } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerFeedbackMessages } from '../../../feedback.messages'

export function ManagerAreaReview({
  order,
  review,
  onEdit,
}: {
  order: OrderDetail
  review: SavedAreaReview | null
  onEdit: () => void
}) {
  const confirmation = usePlanningConfirmation()
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  async function resolve(decision: 'NEED_INFO' | 'REJECTED') {
    if (!review) return
    try {
      const done = await resolveUnsuitable(
        order,
        review,
        decision,
        confirmation.confirm,
      )
      if (done)
        toast.success(
          decision === 'REJECTED' ? fb.orderRejected : fb.infoRequested,
        )
    } catch (cause) {
      toast.error(
        cause instanceof Error ? cause.message : 'Không gửi được quyết định.',
      )
    }
  }
  // Once the order is rejected/cancelled/sent back, the review is history: no more actions.
  const decided = order.status !== 'PENDING'
  return (
    <>
      <div
        className={`odm-or-area-manager-review${review ? ` is-${review.status.toLowerCase()}` : ''}`}
      >
        {review ? (
          <>
            <span className="odm-or-area-review-label">
              Đánh giá của Manager
            </span>
            <strong
              className={`odm-or-area-verdict is-${review.status.toLowerCase()}`}
            >
              <OrderIcon
                name={
                  review.status === 'REJECTED'
                    ? 'x'
                    : review.status === 'PENDING_PERMIT'
                      ? 'alert'
                      : 'shield'
                }
                size={20}
              />
              {areaReviewLabel(review.status)}
            </strong>
            {review.reason ? (
              <p className="odm-or-area-reason">
                <span>Lý do</span>
                {review.reason}
              </p>
            ) : null}
            {review.note ? (
              <p className="odm-or-area-reason">
                <span>Ghi chú</span>
                {review.note}
              </p>
            ) : null}
            <small>
              {review.reviewer ?? 'Manager'}
              {review.reviewedAt
                ? ` · ${new Intl.DateTimeFormat('vi-VN', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  }).format(new Date(review.reviewedAt))}`
                : ''}
            </small>
            {decided ? null : (
              <button
                type="button"
                className="odm-or-area-edit"
                onClick={onEdit}
              >
                <OrderIcon name="edit" size={18} />
                <span>Chỉnh sửa đánh giá</span>
                <OrderIcon name="chevron-right" size={18} />
              </button>
            )}
            {review.status === 'REJECTED' ? (
              <div className="odm-or-area-contact">
                <OrderIcon name="phone" size={20} />
                <div>
                  <span>Liên hệ khách hàng</span>
                  <strong>{order.customer.fullName}</strong>
                  {order.customer.phone ? (
                    <a href={`tel:${order.customer.phone.replace(/\s+/g, '')}`}>
                      {order.customer.phone}
                    </a>
                  ) : (
                    <em>Chưa có số điện thoại</em>
                  )}
                </div>
              </div>
            ) : null}
            {review.status === 'REJECTED' && !decided ? (
              <div className="odm-or-area-secondary-actions">
                <Button onClick={() => void resolve('NEED_INFO')}>
                  <OrderIcon name="swap" size={16} />
                  Yêu cầu khách đổi khu vực
                </Button>
                <Button variant="danger" onClick={() => void resolve('REJECTED')}>
                  <OrderIcon name="x" size={16} />
                  Từ chối đơn hàng
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <>
            <p>Chưa có đánh giá của Manager.</p>
            {decided ? null : (
              <Button
                type="button"
                variant="primary"
                onClick={onEdit}
              >
                Đánh giá khu vực
              </Button>
            )}
            <a href="#portal/manager/support">Cần trợ giúp? Liên hệ hỗ trợ</a>
          </>
        )}
      </div>
      {confirmation.dialog}
    </>
  )
}
