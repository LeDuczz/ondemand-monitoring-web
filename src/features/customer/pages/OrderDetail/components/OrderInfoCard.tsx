import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { fmtDateTime } from '../../../lib/orderStatus'
import { formatDateRange } from '../../../lib/orders/format'
import type { OrderDetailView } from '../../../lib/orders/types'
import { orderInfoCardMessages } from './OrderInfoCard.messages'

const DASH = '—'

function Field({ label, value, mono, wide }: { label: string; value: string; mono?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? 'od-field is-wide' : 'od-field'}>
      <dt>{label}</dt>
      <dd className={mono ? 'od-mono' : undefined}>{value}</dd>
    </div>
  )
}

export function OrderInfoCard({ order }: { order: OrderDetailView }) {
  const { t, locale } = useI18n(orderInfoCardMessages)
  const schedule = formatDateRange(order.dateFrom, order.dateTo, locale)
  const coordinates =
    order.latitude != null && order.longitude != null
      ? `${order.latitude}, ${order.longitude}`
      : DASH

  return (
    <Card title={t.title}>
      <dl className="od-fields">
        <Field label={t.orderId} value={order.id} mono wide />
        <Field
          label={t.createdAt}
          value={order.createdAt ? fmtDateTime(order.createdAt, locale) : DASH}
        />
        <Field label={t.service} value={order.serviceName ?? DASH} />
        <Field label={t.address} value={order.address ?? DASH} wide />
        <Field label={t.coordinates} value={coordinates} mono />
        <Field label={t.radius} value={order.radiusM != null ? `${order.radiusM} m` : DASH} mono />
        <Field
          label={t.schedule}
          value={[schedule, order.timeName].filter(Boolean).join(' · ') || DASH}
          wide
        />
        {order.description && <Field label={t.description} value={order.description} wide />}
      </dl>
    </Card>
  )
}
