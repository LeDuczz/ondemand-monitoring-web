import { StatCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { assignmentReadiness } from '../../../lib/assignmentReadiness'
import type { MissionCalendarItem } from '../../../types/missions'
import { missionsStatsMessages } from './MissionsStats.messages'

/** KPI strip computed from the already-loaded list (no extra API call). */
export function MissionsStats({
  missions,
}: {
  missions: MissionCalendarItem[]
}) {
  const { t } = useI18n(missionsStatsMessages)
  const running = missions.filter(
    (m) => m.status === 'IN_FLIGHT' || m.status === 'IN_PROGRESS',
  ).length
  const waiting = missions.filter((m) => assignmentReadiness(m).needsSetup)
    .length
  const completed = missions.filter((m) => m.status === 'COMPLETED').length
  return (
    <div className="mng-stats">
      <StatCard label={t.total} value={missions.length} />
      <StatCard label={t.running} value={running} />
      <StatCard
        label={t.waiting}
        value={waiting}
        tone={waiting > 0 ? 'warning' : 'default'}
      />
      <StatCard label={t.completed} value={completed} tone="success" />
    </div>
  )
}
