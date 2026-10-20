import { StatCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import {
  formatDuration,
  type DetailData,
} from '../../../components/common/missionDetailHelpers'
import type {
  MissionPlanResponse,
  MissionStaffAssignmentResponse,
} from '../../../types/missions'
import type { MissionChecklistResponse } from '../../../../mission/types/checklistExecution'
import { missionKpisMessages } from './MissionKpis.messages'

/** Compact KPI row: duration, media, checklist progress and crew. */
export function MissionKpis({
  staff,
  accepted,
  detail,
  plan,
  checklist,
}: {
  staff: MissionStaffAssignmentResponse[]
  accepted: number
  detail: DetailData
  plan: MissionPlanResponse | null
  checklist: MissionChecklistResponse | undefined
}) {
  const { t, lang } = useI18n(missionKpisMessages)
  const mediaCount =
    detail.result?.mediaCount ??
    detail.result?.mediaFiles?.length ??
    detail.media.length
  const executions = checklist?.executions ?? []
  const done = executions.filter(
    (item) =>
      item.executionStatus === 'COMPLETED' ||
      item.executionStatus === 'UNABLE_TO_VERIFY',
  ).length
  const actual = detail.result?.durationSeconds != null
  return (
    <div className="mng-stats">
      <StatCard
        label={actual ? t.kpi.actualDuration : t.kpi.duration}
        value={
          actual
            ? formatDuration(detail.result?.durationSeconds, lang)
            : plan?.plannedDurationSec != null
              ? t.plannedSuffix(formatDuration(plan.plannedDurationSec, lang))
              : t.notRecorded
        }
      />
      <StatCard label={t.kpi.media} value={mediaCount} />
      <StatCard
        label={t.kpi.checklist}
        value={executions.length > 0 ? `${done}/${executions.length}` : '—'}
        tone={
          executions.length > 0 && done === executions.length
            ? 'success'
            : 'default'
        }
      />
      <StatCard
        label={t.kpi.crew}
        value={staff.length > 0 ? `${accepted}/${staff.length}` : '—'}
        hint={staff.length > 0 ? t.crewAccepted : undefined}
      />
    </div>
  )
}
