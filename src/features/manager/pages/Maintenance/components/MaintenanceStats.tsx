import { StatCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { maintenanceStatsMessages } from './MaintenanceStats.messages'

/** KPI strip computed from the loaded ticket list. */
export function MaintenanceStats({
  tickets,
}: {
  tickets: MaintenanceTicket[]
}) {
  const { t } = useI18n(maintenanceStatsMessages)
  const open = tickets.filter((x) => x.status === 'OPEN').length
  const inProgress = tickets.filter((x) => x.status === 'IN_PROGRESS').length
  const resolved = tickets.filter(
    (x) => x.status === 'RESOLVED' || x.status === 'CLOSED',
  ).length
  const high = tickets.filter(
    (x) =>
      (x.status === 'OPEN' || x.status === 'IN_PROGRESS') &&
      (x.priority === 'HIGH' || x.priority === 'CRITICAL'),
  ).length
  return (
    <div className="mng-stats">
      <StatCard
        label={t.open}
        value={open}
        tone={open > 0 ? 'warning' : 'default'}
      />
      <StatCard label={t.inProgress} value={inProgress} />
      <StatCard label={t.resolved} value={resolved} tone="success" />
      <StatCard
        label={t.highSeverity}
        value={high}
        tone={high > 0 ? 'danger' : 'default'}
      />
    </div>
  )
}
