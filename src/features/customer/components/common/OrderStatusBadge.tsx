import { StatusBadge, toUiTone } from '../../../../shared/components/ui'
import { useLanguage } from '../../../../shared/i18n'
import type { OrderStatus } from '../../../../shared/types/domain'
import { getOrderStatusMeta } from '../../lib/orderStatus'

/** Order status pill: label (vi/en) and tone come from lib/orderStatus. */
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const { lang } = useLanguage()
  const meta = getOrderStatusMeta(status, lang)
  return <StatusBadge tone={toUiTone(meta.tone)}>{meta.label}</StatusBadge>
}
