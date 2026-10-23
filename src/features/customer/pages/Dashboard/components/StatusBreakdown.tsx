import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { OrderStatusBadge } from '../../../components/common/OrderStatusBadge'
import type { OrderStats } from '../../../lib/orders/types'
import { statusBreakdownMessages } from './StatusBreakdown.messages'

const ROWS = [
  ['PENDING', 'pending'],
  ['APPROVED', 'approved'],
  ['IN_PROGRESS', 'inProgress'],
  ['COMPLETED', 'completed'],
  ['REJECTED', 'rejected'],
  ['CANCELLED', 'cancelled'],
] as const

/** Counts per BE order status, computed from `GET /api/orders/mine`. */
export function StatusBreakdown({ stats }: { stats: OrderStats }) {
  const { t } = useI18n(statusBreakdownMessages)
  return (
    <Card title={t.title}>
      <ul className="dash-breakdown">
        {ROWS.map(([status, key]) => (
          <li key={status} className="dash-breakdown-row" data-status={status}>
            <OrderStatusBadge status={status} />
            <strong className="dash-breakdown-count">{stats[key]}</strong>
            <span className="dash-bar" aria-hidden="true">
              <span
                className="dash-bar-fill"
                style={{ width: `${stats.total > 0 ? (stats[key] / stats.total) * 100 : 0}%` }}
              />
            </span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
