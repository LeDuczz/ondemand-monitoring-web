import {
  PageHeader,
  StatusBadge,
  toUiTone,
} from '../../../../../shared/components/ui'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import {
  getMissionStatusLabel,
  missionStatusTone,
} from '../../../../../shared/lib/statusTone'
import { managerHref } from '../../../routes'
import type { MissionResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { MissionBackLink } from './MissionBackLink'
import { missionDetailHeaderMessages } from './MissionDetailHeader.messages'

/** Back link, mission code, status badge and the primary actions. */
export function MissionDetailHeader({
  mission,
  canSetup,
}: {
  mission: MissionResponse
  canSetup: boolean
}) {
  const { t, lang } = useI18n(missionDetailHeaderMessages)
  const stopLabel = missionStopLabel(mission)
  return (
    <PageHeader
      back={<MissionBackLink />}
      title={<span className="odm-mono">{mission.missionCode}</span>}
      subtitle={mission.orderTitle}
      actions={
        <div className="odm-md-actions">
          {stopLabel ? (
            <StatusBadge tone="warning">{stopLabel}</StatusBadge>
          ) : (
            <StatusBadge tone={toUiTone(missionStatusTone[mission.status])}>
              {getMissionStatusLabel(mission.status, lang)}
            </StatusBadge>
          )}
          <a
            className="odm-btn"
            href={managerHref({
              screen: 'orderReview',
              orderId: mission.orderId,
            })}
          >
            {t.openOrderPlan}
          </a>
          {canSetup ? (
            <a
              className="odm-btn odm-btn-p"
              href={managerHref({
                screen: 'missionSetup',
                missionId: mission.id,
              })}
            >
              {t.continueSetup}
            </a>
          ) : null}
        </div>
      }
    />
  )
}
