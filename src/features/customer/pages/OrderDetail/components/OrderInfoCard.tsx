import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { OrderIcon, type OrderIconName } from '../../../../manager/components/orderReview/OrderIcon'
import { useTimeslotLabel } from '../../../hooks/usePreferredTimes'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import { fmtDateTime } from '../../../lib/orderStatus'
import { formatDateRange } from '../../../lib/orders/format'
import type { OrderDetailView } from '../../../lib/orders/types'
import { CardTitle } from './CardTitle'
import { orderInfoCardMessages } from './OrderInfoCard.messages'

const DASH = '—'

function Field({
  icon,
  label,
  value,
  num,
  wide,
}: {
  icon: OrderIconName
  label: string
  value: string
  num?: boolean
  wide?: boolean
}) {
  return (
    <div className={wide ? 'od-field is-wide' : 'od-field'}>
      <span className="od-field-icon">
        <OrderIcon name={icon} size={16} />
      </span>
      <div className="od-field-body">
        <dt>{label}</dt>
        <dd className={num ? 'od-num' : undefined}>{value}</dd>
      </div>
    </div>
  )
}

export function OrderInfoCard({ order }: { order: OrderDetailView }) {
  const { t, locale, lang } = useI18n(orderInfoCardMessages)
  const timeLabel = useTimeslotLabel()
  const time =
    order.timeName || order.timeId ? timeLabel({ id: order.timeId, name: order.timeName }) : null
  const schedule = formatDateRange(order.dateFrom, order.dateTo, locale)
  const coordinates =
    order.latitude != null && order.longitude != null
      ? `${order.latitude}, ${order.longitude}`
      : DASH

  return (
    <Card title={<CardTitle icon="doc">{t.title}</CardTitle>}>
      <dl className="od-fields">
        <Field
          icon="stack"
          label={t.service}
          value={
            order.serviceName
              ? localizeServiceName(order.serviceId ?? order.serviceName, lang, order.serviceName)
              : DASH
          }
        />
        <Field
          icon="calendar"
          label={t.createdAt}
          value={order.createdAt ? fmtDateTime(order.createdAt, locale) : DASH}
        />
        <Field
          icon="calendar"
          label={t.schedule}
          value={[schedule, time].filter(Boolean).join(' · ') || DASH}
        />
        <Field icon="target" label={t.radius} value={order.radiusM != null ? `${order.radiusM} m` : DASH} num />
        <Field icon="pin" label={t.address} value={order.address ?? DASH} wide />
        <Field icon="locate" label={t.coordinates} value={coordinates} num wide />
      </dl>
      {order.description && (
        <div className="od-desc">
          <div className="od-desc-label">
            <OrderIcon name="file" size={16} />
            {t.description}
          </div>
          <p>{order.description}</p>
        </div>
      )}
    </Card>
  )
}
