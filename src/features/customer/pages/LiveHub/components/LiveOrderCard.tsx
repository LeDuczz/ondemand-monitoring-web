import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import type { OrderRow } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { liveOrderCardMessages } from './LiveOrderCard.messages'

export function LiveOrderCard({ order }: { order: OrderRow }) {
  const { t } = useI18n(liveOrderCardMessages)
  return (
    <Card className="lh-card-shell">
      <div className="lh-card">
        <div className="lh-card-head">
          <span className="lh-live">{t.live}</span>
          <OrderStatusBadge status={order.status} />
        </div>
        <strong className="lh-title">{order.title}</strong>
        <div className="lh-sub">
          {order.code ? <span className="lh-code">{order.code}</span> : null}
          {order.address ? <span>{order.address}</span> : null}
        </div>
        <a
          className="odm-btn odm-btn-gh lh-enter"
          href={customerHref({ screen: 'orderDetail', orderId: order.id })}
        >
          {t.enter}
        </a>
      </div>
    </Card>
  )
}
