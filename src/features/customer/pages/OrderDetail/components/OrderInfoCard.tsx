import { useState } from 'react'

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
  mono,
  wide,
  action,
}: {
  icon: OrderIconName
  label: string
  value: string
  mono?: boolean
  wide?: boolean
  action?: React.ReactNode
}) {
  return (
    <div className={wide ? 'od-field is-wide' : 'od-field'}>
      <span className="od-field-icon">
        <OrderIcon name={icon} size={16} />
      </span>
      <div className="od-field-body">
        <dt>{label}</dt>
        <dd className={mono ? 'od-mono' : undefined}>
          <span>{value}</span>
          {action}
        </dd>
      </div>
    </div>
  )
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    try {
      void navigator.clipboard?.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard may be unavailable (insecure context); the id stays selectable.
    }
  }
  return (
    <button type="button" className="od-copy" onClick={copy} aria-label={label} title={label}>
      <OrderIcon name={copied ? 'check' : 'copy'} size={14} />
    </button>
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
          icon="doc"
          label={t.orderId}
          value={order.code}
          mono
          wide
          action={<CopyButton value={order.code} label={t.copyId} />}
        />
        <Field
          icon="calendar"
          label={t.createdAt}
          value={order.createdAt ? fmtDateTime(order.createdAt, locale) : DASH}
        />
        <Field
          icon="stack"
          label={t.service}
          value={
            order.serviceName
              ? localizeServiceName(order.serviceId ?? order.serviceName, lang, order.serviceName)
              : DASH
          }
        />
        <Field icon="pin" label={t.address} value={order.address ?? DASH} wide />
        <Field icon="locate" label={t.coordinates} value={coordinates} mono wide />
        <Field
          icon="calendar"
          label={t.schedule}
          value={[schedule, time].filter(Boolean).join(' · ') || DASH}
        />
        <Field icon="target" label={t.radius} value={order.radiusM != null ? `${order.radiusM} m` : DASH} mono />
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
