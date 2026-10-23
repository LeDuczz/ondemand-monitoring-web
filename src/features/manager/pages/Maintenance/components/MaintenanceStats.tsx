import { StatCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { maintenancePageMessages } from '../MaintenancePage.messages'
import type { ticketStats } from '../maintenanceHelpers'

export function MaintenanceStats({
  stats,
}: {
  stats: ReturnType<typeof ticketStats>
}) {
  const { t } = useI18n(maintenancePageMessages)
  return (
    <div className="odm-or-stats">
      <StatCard
        label={t.stats.open}
        value={stats.open}
        hint={t.stats.openHint}
        tone={stats.open > 0 ? 'warning' : 'default'}
      />
      <StatCard
        label={t.stats.inProgress}
        value={stats.inProgress}
        hint={t.stats.inProgressHint}
      />
      <StatCard
        label={t.stats.resolved}
        value={stats.resolved}
        hint={t.stats.resolvedHint}
        tone={stats.resolved > 0 ? 'success' : 'default'}
      />
      <StatCard
        label={t.stats.highSeverity}
        value={stats.highSeverity}
        hint={t.stats.highSeverityHint}
        tone={stats.highSeverity > 0 ? 'danger' : 'default'}
      />
    </div>
  )
}
