import { MockDataBadge } from '../../../../../shared/components/ui'
import { OrderIcon } from '../../../../manager/components/orderReview/OrderIcon'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderDetailView } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { orderActionsMessages } from './OrderActions.messages'

type Props = { order: OrderDetailView; onCancel: () => void }

/** Cancel is mock-only (no BE endpoint), hence the sample-data badge. */
export function OrderActions({ order, onCancel }: Props) {
  const { t } = useI18n(orderActionsMessages)
  const active = order.status === 'IN_PROGRESS'
  const hasMedia = active || order.status === 'COMPLETED'

  return (
    <div className="od-actions">
      <a
        className="odm-btn od-btn od-btn-primary-outline"
        href={customerHref({ screen: 'analysis', orderId: order.id })}
      >
        <OrderIcon name="ai" size={16} />
        {t.analysis}
      </a>
      {active && (
        <a className="odm-btn od-btn" href={customerHref({ screen: 'live', orderId: order.id })}>
          <OrderIcon name="locate" size={16} />
          {t.live}
        </a>
      )}
      {hasMedia && (
        <a className="odm-btn od-btn" href={customerHref({ screen: 'media', orderId: order.id })}>
          <OrderIcon name="media" size={16} />
          {t.media}
        </a>
      )}
      {order.canCancel && (
        <span className="od-cancel">
          <button type="button" className="odm-btn od-btn od-btn-cancel" onClick={onCancel}>
            <OrderIcon name="trash" size={16} />
            {t.cancelOrder}
          </button>
          <MockDataBadge />
        </span>
      )}
    </div>
  )
}
