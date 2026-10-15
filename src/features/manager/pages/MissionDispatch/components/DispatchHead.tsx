import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  missionStatusTone,
  getMissionStatusLabel,
} from '../../../../../shared/lib/statusTone'
import type { Mission } from '../../../types/missions'
import { PageHeader } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { dispatchHeadMessages } from './DispatchHead.messages'

export function DispatchHead({
  setupMode,
  mission,
}: {
  setupMode: boolean
  mission: Mission
}) {
  const { t, lang } = useI18n(dispatchHeadMessages)
  return (
    <PageHeader
      title={setupMode ? t.missionSetup : t.title}
      subtitle={
        setupMode
          ? `${mission.orderCode ?? t.order} → ${mission.missionCode}`
          : t.subtitle
      }
      actions={
        <StatusBadge tone={missionStatusTone[mission.status]} size="lg">
          {getMissionStatusLabel(mission.status, lang)}
        </StatusBadge>
      }
    />
  )
}
