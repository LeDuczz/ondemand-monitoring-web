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

export function MissionStatusBadge({ mission }: { mission: OperatorMission }) {
  const { t } = useI18n(missionStatusBadgeMessages)

  return (
    <StatusBadge tone={STATUS_TONE[mission.status]}>
      {missionStopLabel(mission) ??
        t.statusLabel[mission.status] ??
        mission.backendStatus ??
        mission.status}
    </StatusBadge>
  )
}
