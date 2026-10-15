import { StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import {
  getOrderStatusLabel,
  orderStatusTone,
} from '../../../../../shared/lib/statusTone'
import type { OrderDetail } from '../../../types/orders'
import { formatOrderCode } from '../../../components/common/format'
import { OrderIcon } from '../../../components/common/OrderIcon'

/** Order status (and optionally code) shown at the right of the review header. */
export function OrderBannerMeta({
  order,
  locale,
  showCode = true,
}: {
  order: Pick<OrderDetail, 'code' | 'status'>
  locale: 'vi-VN' | 'en-US'
  showCode?: boolean
}) {
  const pending = order.status === 'PENDING'
  return (
    <>
      {showCode ? (
        <span className="odm-osb-code">{formatOrderCode(order.code)}</span>
      ) : null}
      <StatusBadge
        tone={toUiTone(pending ? 'yellow' : orderStatusTone[order.status])}
      >
        {pending ? <OrderIcon name="clock" size={13} /> : null}
        {getOrderStatusLabel(order.status, locale === 'en-US' ? 'en' : 'vi')}
      </StatusBadge>
    </>
  )
}
