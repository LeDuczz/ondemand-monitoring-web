import type { OrderDetail } from '../../types/orders'
import { preferredLabel } from '../../lib/viLabels'
import { estimatedAreaHa } from './format'
import { OrderIcon } from './OrderIcon'
import { Card } from '../../../../shared/components/ui'
import { resolveOrderGpsCenter } from './orderGps'
import { useI18n } from '../../../../shared/i18n'
import { orderServiceInfoMessages } from './OrderServiceInfo.messages'

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

function locationLabel(order: OrderDetail, t: { pickedMapLocation: string }) {
  const resolved = resolveOrderGpsCenter(order.center)
  if (resolved && (!order.addressText || isGenericAddress(order.addressText))) {
    return `${t.pickedMapLocation} · ${resolved.center.lat}, ${resolved.center.lon}`
  }
  return order.addressText ?? '—'
}

export function OrderServiceInfo({
  order,
  hideService = false,
}: {
  order: OrderDetail
  /** Skip the service tile when a banner above already shows it. */
  hideService?: boolean
}) {
  const { t } = useI18n(orderServiceInfoMessages)

  const areaHa = estimatedAreaHa(order.radiusM)
  const preferred =
    preferredLabel(
      order.preferredDate,
      order.preferredTimeName,
      order.preferredWindow,
    ) || null
  const resolvedCenter = resolveOrderGpsCenter(order.center)

  const rows: Array<{ label: string; value: string; copyText?: string }> = []
  if (!hideService) {
    rows.push({ label: t.service, value: order.serviceName })
  }
  rows.push(
    { label: t.preferredWindow, value: preferred ?? '—' },
    { label: t.locationLabel, value: locationLabel(order, t) },
    {
      label: t.centerCoords,
      value: centerLabel(order),
      copyText: resolvedCenter
        ? `${resolvedCenter.center.lat}, ${resolvedCenter.center.lon}`
        : undefined,
    },
    {
      label: t.monitoringRadius,
      value: order.radiusM != null ? `${order.radiusM} m` : '—',
    },
    {
      label: t.estimatedArea,
      value: areaHa != null ? `${areaHa} ha` : '—',
    },
  )
  if (order.nearestBase) {
    rows.push({ label: t.nearestBase, value: order.nearestBase })
  }
  return (
    <Card title={t.serviceAndMedia}>
      <dl className="odm-or-kv">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>
              {row.value}
              {row.copyText ? (
                <button
                  type="button"
                  className="odm-or-copy"
                  aria-label={`${t.copy}: ${row.label}`}
                  onClick={() =>
                    void navigator.clipboard?.writeText(row.copyText ?? '')
                  }
                >
                  <OrderIcon name="copy" size={14} />
                </button>
              ) : null}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}
