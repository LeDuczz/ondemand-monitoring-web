import type { ReactNode } from 'react'

import type { OrderDetail } from '../../types/orders'
import type { OrderReviewMessages } from '../../pages/OrderReviewPage.messages'
import { preferredLabel } from '../../lib/viLabels'
import { estimatedAreaHa } from './format'
import { OrderIcon, type OrderIconName } from './OrderIcon'
import { resolveOrderGpsCenter } from './orderGps'

type InfoTile = {
  icon: OrderIconName
  label: string
  value: ReactNode
  copyText?: string
}

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

function InfoTileCard({
  tile,
  copyLabel,
}: {
  tile: InfoTile
  copyLabel: string
}) {
  const { copyText } = tile
  return (
    <div className="odm-or-svc-tile">
      <span className="odm-or-svc-ico" aria-hidden="true">
        <OrderIcon name={tile.icon} size={20} />
      </span>
      <div className="odm-or-svc-tile-text">
        <dt>{tile.label}</dt>
        <dd>{tile.value}</dd>
      </div>
      {copyText ? (
        <button
          type="button"
          className="odm-or-svc-copy"
          aria-label={`${copyLabel}: ${tile.label}`}
          onClick={() => void navigator.clipboard?.writeText(copyText)}
        >
          <OrderIcon name="copy" size={15} />
        </button>
      ) : null}
    </div>
  )
}

export function OrderServiceInfo({
  order,
  t,
  hideService = false,
}: {
  order: OrderDetail
  t: OrderReviewMessages
  /** Skip the service tile when a banner above already shows it. */
  hideService?: boolean
}) {
  const areaHa = estimatedAreaHa(order.radiusM)
  const preferred =
    preferredLabel(
      order.preferredDate,
      order.preferredTimeName,
      order.preferredWindow,
    ) || null
  const resolvedCenter = resolveOrderGpsCenter(order.center)

  const tiles: InfoTile[] = []
  if (!hideService) {
    tiles.push({ icon: 'service', label: t.service, value: order.serviceName })
  }
  tiles.push(
    { icon: 'pin', label: t.locationLabel, value: locationLabel(order, t) },
    {
      icon: 'target',
      label: t.centerCoords,
      value: centerLabel(order),
      copyText: resolvedCenter
        ? `${resolvedCenter.center.lat}, ${resolvedCenter.center.lon}`
        : undefined,
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
  )
  if (order.nearestBase) {
    tiles.push({
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
        <dl className="odm-or-svc-grid">
          <div className="odm-or-svc-time">
            <span className="odm-or-svc-ico" aria-hidden="true">
              <OrderIcon name="calendar" size={30} />
            </span>
            <div className="odm-or-svc-tile-text">
              <dt>{t.preferredWindow}</dt>
              <dd>{preferred ?? '—'}</dd>
            </div>
          </div>
          <div className="odm-or-svc-tiles">
            {tiles.map((tile) => (
              <InfoTileCard key={tile.label} tile={tile} copyLabel={t.copy} />
            ))}
          </div>
        </dl>
      </div>
    </section>
  )
}
