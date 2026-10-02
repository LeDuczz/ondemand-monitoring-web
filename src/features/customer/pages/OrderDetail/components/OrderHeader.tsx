import { PageHeader } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import type { OrderDetailView } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { orderHeaderMessages } from './OrderHeader.messages'

export function OrderHeader({ order }: { order: OrderDetailView }) {
  const { t } = useI18n(orderHeaderMessages)
  return (
    <PageHeader
      back={<a href={customerHref({ screen: 'orders' })}>{t.backToOrders}</a>}
      title={order.title}
      subtitle={
        <span className="od-meta">
          <OrderStatusBadge status={order.status} />
          <span>{`${t.codeLabel}: ${order.code}`}</span>
        </span>
      }
    />
  )
}
