import type { OrderDetail } from '../../../types/orders'
import { formatOrderCode, formatVn } from '../../../components/common/format'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import {
  getOrderStatusLabel,
  orderStatusTone,
} from '../../../../../shared/lib/statusTone'
import { useI18n } from '../../../../../shared/i18n'
import { orderStatusCardMessages } from './OrderStatusCard.messages'

export function OrderStatusCard({
  order,
  locale,
}: {
  order: OrderDetail
  locale: 'vi-VN' | 'en-US'
}) {
  const { t } = useI18n(orderStatusCardMessages)

  // The detail payload has no "updated at" field — show a dash instead of
  // inventing a value.
  const rows = [
    {
      icon: 'tag' as const,
      label: t.orderCode,
      value: formatOrderCode(order.code),
    },
    {
      icon: 'calendar' as const,
      label: t.createdAt,
      value: order.submittedAt ? formatVn(order.submittedAt, locale) : '—',
    },
    { icon: 'refresh' as const, label: t.updatedAt, value: '—' },
  ]

  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="target" size={18} />
          {t.orderStatus}
        </span>
        <StatusBadge tone={toUiTone(orderStatusTone[order.status])}>
          {getOrderStatusLabel(order.status, locale === 'en-US' ? 'en' : 'vi')}
        </StatusBadge>
      </header>
      <dl className="odm-or-card-body odm-or-status-list">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>
              <OrderIcon name={row.icon} size={16} />
              {row.label}
            </dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
