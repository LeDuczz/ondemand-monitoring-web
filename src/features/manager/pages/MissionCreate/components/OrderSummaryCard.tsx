import type { ReactNode } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import { humanizeMediaRequirement } from '../../../components/common/format'
import {
  OrderIcon,
  type OrderIconName,
} from '../../../components/common/OrderIcon'
import type { OrderMissionBrief } from '../../../types/orders'
import { orderSummaryCardMessages } from './OrderSummaryCard.messages'

export function OrderSummaryCard({ brief }: { brief: OrderMissionBrief }) {
  const { t } = useI18n(orderSummaryCardMessages)
  const localizeMediaLabel = (label: string) =>
    humanizeMediaRequirement(label, t)

  const summaryRows: Array<{
    icon: OrderIconName
    label: string
    value: ReactNode
  }> = [
    { icon: 'service', label: t.serviceLabel, value: brief.serviceName },
    { icon: 'user', label: t.customerLabel, value: brief.customerFullName },
    { icon: 'pin', label: t.locationLabel, value: brief.addressText ?? '—' },
    {
      icon: 'radius',
      label: t.radiusLabel,
      value: brief.radiusM != null ? `${brief.radiusM} m` : '—',
    },
  ]
  if (brief.nearestBase) {
    summaryRows.push({
      icon: 'drone',
      label: t.nearestBaseLabel,
      value: brief.nearestBase,
    })
  }

  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="doc" size={18} />
          {t.orderSummary}
        </span>
      </header>
      <dl className="odm-or-card-body odm-or-summary-list">
        {summaryRows.map((row) => (
          <div key={row.label}>
            <dt>
              <OrderIcon name={row.icon} size={16} />
              {row.label}
            </dt>
            <dd>{row.value}</dd>
          </div>
        ))}
        {brief.mediaRequirements && brief.mediaRequirements.length > 0 ? (
          <div>
            <dt>
              <OrderIcon name="media" size={16} />
              {t.mediaLabel}
            </dt>
            <dd className="odm-or-info-lines">
              {brief.mediaRequirements.map((req, i) => (
                <span key={i}>{localizeMediaLabel(req.label)}</span>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
    </section>
  )
}
