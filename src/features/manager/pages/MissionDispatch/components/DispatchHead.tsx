import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  missionStatusTone,
  getMissionStatusLabel,
} from '../../../../../shared/lib/statusTone'
import type { Mission } from '../../../types/missions'
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
    <div className="odm-mgr-dash-head">
      <div>
        <h1 className="odm-mgr-dash-title">
          {setupMode ? t.missionSetup : t.title}
        </h1>
        <div className="odm-mgr-dash-date">
          {setupMode
            ? `${mission.orderCode ?? t.order} → ${mission.missionCode}`
            : t.subtitle}
        </div>
      </div>
      <StatusBadge tone={missionStatusTone[mission.status]} size="lg">
        {getMissionStatusLabel(mission.status, lang)}
      </StatusBadge>
    </div>
  )
}
