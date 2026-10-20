import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import type { OperatorMission } from '../../../types/mission'
import { missionStatusBadgeMessages } from './MissionStatusBadge.messages'

const STATUS_TONE = {
  ...missionStatusTone,
  UNKNOWN: 'gray',
  PENDING: 'gray',
  ACCEPTED: 'green',
  IN_FLIGHT: 'blue',
  COMPLETED: 'green',
  REJECTED: 'red',
  FAILED: 'red',
} as const

/** Operator-facing label of a backend (or mapped) mission status. */
export function missionStatusLabel(
  status: string | null | undefined,
  t: typeof missionStatusBadgeMessages.vi,
) {
  if (!status) return t.unspecified
  return t.statusLabel[status] ?? t.unsupported
}

export function MissionStatusBadge({ mission }: { mission: OperatorMission }) {
  const { t } = useI18n(missionStatusBadgeMessages)

  return (
    <StatusBadge tone={STATUS_TONE[mission.status]}>
      {missionStopLabel(mission) ??
        missionStatusLabel(mission.backendStatus ?? mission.status, t)}
    </StatusBadge>
  )
}
