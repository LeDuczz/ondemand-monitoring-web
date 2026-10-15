import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { managerHref } from '../../../routes'
import type { MissionResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionDetailHeaderMessages } from './MissionDetailHeader.messages'

export function MissionDetailHeader({
  mission,
  canSetup,
}: {
  mission: MissionResponse
  canSetup: boolean
}) {
  const { t } = useI18n(missionDetailHeaderMessages)
  return (
    <div className="odm-or-pagehead odm-or-md-head">
      <div>
        <h1 className="odm-or-title odm-mono">{mission.missionCode}</h1>
        <p className="odm-or-subtitle">{mission.orderTitle}</p>
      </div>
      <div className="odm-or-md-actions">
        {missionStopLabel(mission) ? (
          <StatusBadge tone="yellow">{missionStopLabel(mission)}</StatusBadge>
        ) : (
          <StatusBadge
            kind="mission"
            status={mission.status}
            tone={missionStatusTone[mission.status]}
          />
        )}
        {canSetup ? (
          <a
            className="odm-or-btn odm-or-btn-blue"
            href={managerHref({
              screen: 'missionSetup',
              missionId: mission.id,
            })}
          >
            {t.continueSetup}
          </a>
        ) : null}
      </div>
    </div>
  )
}
