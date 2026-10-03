import type { ReactNode } from 'react'

import type { OrderDetail } from '../../types/orders'
import type { OrderReviewMessages } from '../../pages/OrderReviewPage.messages'
import { preferredLabel } from '../../lib/viLabels'
import { estimatedAreaHa, humanizeMediaRequirement } from './format'
import { OrderIcon, type OrderIconName } from './OrderIcon'
import { resolveOrderGpsCenter } from './orderGps'

type InfoRow = { icon: OrderIconName; label: string; value: ReactNode }

function centerLabel(order: OrderDetail) {
  const resolved = resolveOrderGpsCenter(order.center)
  if (!resolved) return '—'
  return `${resolved.center.lat}, ${resolved.center.lon}`
}

function isGenericAddress(value: string | null) {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return [
    'công trường xây dựng',
    'cong truong xay dung',
    'đập nước',
    'dap nuoc',
  ].includes(normalized)
}

function locationLabel(order: OrderDetail, t: OrderReviewMessages) {
  const resolved = resolveOrderGpsCenter(order.center)
  if (resolved && (!order.addressText || isGenericAddress(order.addressText))) {
    return `${t.pickedMapLocation} · ${resolved.center.lat}, ${resolved.center.lon}`
  }
  return order.addressText ?? '—'
}

function InfoColumn({ rows }: { rows: InfoRow[] }) {
  return (
    <dl className="odm-or-info-col">
      {rows.map((row) => (
        <div key={row.label} className="odm-or-info-row">
          <dt>
            <OrderIcon name={row.icon} size={16} />
            {row.label}
          </dt>
          <dd>{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function OrderServiceInfo({
  order,
  t,
}: {
  order: OrderDetail
  t: OrderReviewMessages
}) {
  const areaHa = estimatedAreaHa(order.radiusM)
  const preferred =
    preferredLabel(
      order.preferredDate,
      order.preferredTimeName,
      order.preferredWindow,
    ) || null

  const media =
    order.mediaRequirements == null ? (
      t.noData
    ) : order.mediaRequirements.length === 0 ? (
      '—'
    ) : (
      <span className="odm-or-info-lines">
        {order.mediaRequirements.map((req, i) => (
          <span key={i}>{humanizeMediaRequirement(req.label, t)}</span>
        ))}
      </span>
    )

  const left: InfoRow[] = [
    { icon: 'service', label: t.service, value: order.serviceName },
    { icon: 'clock', label: t.preferredWindow, value: preferred ?? '—' },
    { icon: 'media', label: t.mediaPackage, value: media },
  ]
  const right: InfoRow[] = [
    { icon: 'pin', label: t.locationLabel, value: locationLabel(order, t) },
    {
      icon: 'target',
      label: t.centerCoords,
      value: centerLabel(order),
    },
    {
      icon: 'radius',
      label: t.monitoringRadius,
      value: order.radiusM != null ? `${order.radiusM} m` : '—',
    },
    {
      icon: 'area',
      label: t.estimatedArea,
      value: areaHa != null ? `${areaHa} ha` : '—',
    },
  ]
  if (order.nearestBase) {
    right.push({
      icon: 'drone',
      label: t.nearestBase,
      value: order.nearestBase,
    })
  }

  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="doc" size={18} />
          {t.serviceAndMedia}
        </span>
      </header>
      <div className="odm-or-card-body odm-or-cq">
        <div className="odm-or-info-grid">
          <InfoColumn rows={left} />
          <InfoColumn rows={right} />
        </div>
        {order.purpose ? (
          <div className="odm-or-ai">
            <span className="odm-or-ai-badge" aria-hidden="true">
              AI
            </span>
            <div>
              <div className="odm-or-ai-title">{t.aiSummary}</div>
              <p className="odm-or-ai-text">{order.purpose}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
