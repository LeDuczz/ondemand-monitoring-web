import { MockDataBadge } from '../../../../../shared/components/ui'
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
        className="odm-btn odm-btn-gh"
        href={customerHref({ screen: 'analysis', orderId: order.id })}
      >
        {t.analysis}
      </a>
      {active && (
        <a className="odm-btn odm-btn-gh" href={customerHref({ screen: 'live', orderId: order.id })}>
          {t.live}
        </a>
      )}
      {hasMedia && (
        <a className="odm-btn odm-btn-gh" href={customerHref({ screen: 'media', orderId: order.id })}>
          {t.media}
        </a>
      )}
      {order.canCancel && (
        <span className="od-cancel">
          <button type="button" className="odm-btn odm-btn-de" onClick={onCancel}>
            {t.cancelOrder}
          </button>
          <MockDataBadge />
        </span>
      )}
    </div>
  )
}
