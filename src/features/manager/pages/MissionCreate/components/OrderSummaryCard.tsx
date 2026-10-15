import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { humanizeMediaRequirement } from '../../../components/common/format'
import type { OrderMissionBrief } from '../../../types/orders'
import { orderSummaryCardMessages } from './OrderSummaryCard.messages'

export function OrderSummaryCard({ brief }: { brief: OrderMissionBrief }) {
  const { t } = useI18n(orderSummaryCardMessages)
  const localizeMediaLabel = (label: string) =>
    humanizeMediaRequirement(label, t)

  const rows: Array<{ label: string; value: string }> = [
    { label: t.serviceLabel, value: brief.serviceName },
    { label: t.customerLabel, value: brief.customerFullName },
    { label: t.locationLabel, value: brief.addressText ?? '—' },
    {
      label: t.radiusLabel,
      value: brief.radiusM != null ? `${brief.radiusM} m` : '—',
    },
  ]
  if (brief.nearestBase) {
    rows.push({ label: t.nearestBaseLabel, value: brief.nearestBase })
  }

  return (
    <Card title={t.orderSummary}>
      <dl className="odm-or-kv">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
        {brief.mediaRequirements && brief.mediaRequirements.length > 0 ? (
          <div>
            <dt>{t.mediaLabel}</dt>
            <dd className="odm-plan-lines">
              {brief.mediaRequirements.map((req, i) => (
                <span key={i}>{localizeMediaLabel(req.label)}</span>
              ))}
            </dd>
          </div>
        ) : null}
      </dl>
    </Card>
  )
}
