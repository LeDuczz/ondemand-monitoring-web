import { StatCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderStats } from '../../../lib/orders/types'
import { dashboardStatsMessages } from './DashboardStats.messages'

export function DashboardStats({ stats }: { stats: OrderStats }) {
  const { t } = useI18n(dashboardStatsMessages)
  return (
    <div className="dash-stats">
      <StatCard label={t.total} value={stats.total} hint={t.unit} />
      <StatCard
        label={t.pending}
        value={stats.pending}
        hint={t.unit}
        tone={stats.pending > 0 ? 'warning' : 'default'}
      />
      <StatCard label={t.inProgress} value={stats.inProgress} hint={t.unit} />
      <StatCard
        label={t.completed}
        value={stats.completed}
        hint={t.unit}
        tone={stats.completed > 0 ? 'success' : 'default'}
      />
    </div>
  )
}
