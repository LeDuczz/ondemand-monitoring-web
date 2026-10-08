import { PageHeader } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import type { OrderDetailView } from '../../../lib/orders/types'
import { customerHref } from '../../../routes'
import { CopyButton } from './CopyButton'
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
          <span className="od-code">
            <span>{`${t.codeLabel}:`}</span>
            <span className="od-mono">{order.code}</span>
            <CopyButton value={order.code} label={t.copyId} />
          </span>
        </span>
      }
    />
  )
}
