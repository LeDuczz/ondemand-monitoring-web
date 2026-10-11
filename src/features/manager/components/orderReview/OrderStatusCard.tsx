import type { OrderDetail } from '../../types/orders'
import type { OrderReviewMessages } from '../../pages/OrderReviewPage.messages'
import { formatOrderCode, formatVn } from './format'
import { OrderIcon } from './OrderIcon'

export function OrderStatusCard({
  order,
  t,
  locale,
}: {
  order: OrderDetail
  t: OrderReviewMessages
  locale: 'vi-VN' | 'en-US'
}) {
  // The detail payload has no "updated at" field — show a dash instead of
  // inventing a value.
  const rows = [
    { icon: 'tag' as const, label: t.orderCode, value: formatOrderCode(order.code) },
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
        <span className="odm-or-pill odm-or-pill-amber">
          <OrderIcon name="clock" size={14} />
          {t.statusPending}
        </span>
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
