import { useI18n } from '../../../../../shared/i18n'
import {
  formatDateTime,
  formatDuration,
  type DetailData,
} from '../../../components/common/missionDetailHelpers'
import type {
  MissionPlanResponse,
  MissionResponse,
  MissionStaffAssignmentResponse,
} from '../../../types/missions'
import { missionKpisMessages } from './MissionKpis.messages'

export function MissionKpis({
  mission,
  deviceLabel,
  staff,
  accepted,
  detail,
  plan,
}: {
  mission: MissionResponse
  deviceLabel: string
  staff: MissionStaffAssignmentResponse[]
  accepted: number
  detail: DetailData
  plan: MissionPlanResponse | null
}) {
  const { t, locale } = useI18n(missionKpisMessages)
  const mediaCount =
    detail.result?.mediaCount ??
    detail.result?.mediaFiles?.length ??
    detail.media.length
  const kpis: Array<{ label: string; value: string }> = [
    { label: t.kpi.customer, value: mission.customerName || '—' },
    {
      label: t.kpi.schedule,
      value: formatDateTime(mission.scheduledStartAt, locale),
    },
    { label: t.kpi.drone, value: deviceLabel },
    {
      label: t.kpi.crew,
      value: staff.length > 0 ? t.crewAccepted(accepted, staff.length) : '—',
    },
    { label: t.kpi.media, value: String(mediaCount) },
    {
      label:
        detail.result?.durationSeconds != null
          ? t.kpi.actualDuration
          : t.kpi.plannedDuration,
      value: formatDuration(
        detail.result?.durationSeconds ?? plan?.plannedDurationSec,
      ),
    },
  ]
  return (
    <div className="odm-or-md-kpis">
      {kpis.map((item) => (
        <div key={item.label} className="odm-or-md-kpi">
          <span>{item.label}</span>
          <strong title={item.value}>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}
