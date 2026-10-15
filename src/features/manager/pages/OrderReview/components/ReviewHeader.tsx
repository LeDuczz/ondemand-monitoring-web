import {
  PageHeader,
  StatusBadge,
  toUiTone,
} from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import {
  getOrderStatusLabel,
  orderStatusTone,
} from '../../../../../shared/lib/statusTone'
import { formatOrderCode } from '../../../components/common/format'
import { managerHref } from '../../../routes'
import type { OrderDetail } from '../../../types/orders'
import { orderDeliverableLabels } from '../orderDeliverableLabels'
import { reviewHeaderMessages } from './ReviewHeader.messages'

/** Back link, order code, service and status badge shared by every state. */
export function ReviewHeader({
  orderId,
  order,
}: {
  orderId: string
  order?: OrderDetail
}) {
  const { t, lang, locale } = useI18n(reviewHeaderMessages)
  const subtitle = order
    ? [order.serviceName, orderDeliverableLabels(order, locale).join(', ')]
        .filter(Boolean)
        .join(' · ')
    : undefined
  return (
    <PageHeader
      back={<a href={managerHref({ screen: 'orderQueue' })}>{t.back}</a>}
      title={order ? formatOrderCode(order.code) : orderId}
      subtitle={subtitle}
      actions={
        order ? (
          <StatusBadge tone={toUiTone(orderStatusTone[order.status])}>
            {getOrderStatusLabel(order.status, lang)}
          </StatusBadge>
        ) : null
      }
    />
  )
}
