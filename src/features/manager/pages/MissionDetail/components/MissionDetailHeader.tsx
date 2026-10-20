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
import { formatOrderCode } from '../../../components/common/format'
import { formatDateTime } from '../../../components/common/missionDetailHelpers'
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
  const { t, lang, locale } = useI18n(missionDetailHeaderMessages)
  const stopLabel = missionStopLabel(mission)
  const headline =
    mission.orderTitle && mission.orderTitle.trim().length > 2
      ? mission.orderTitle.trim()
      : null
  return (
    <PageHeader
      back={<MissionBackLink />}
      title={<span className="odm-mono">{mission.missionCode}</span>}
      subtitle={
        <>
          <span className={headline ? undefined : 'odm-md-muted'}>
            {headline ?? t.noDescription}
          </span>
          <span className="odm-md-meta">
            {mission.orderCode ? (
              <span>{formatOrderCode(mission.orderCode)}</span>
            ) : null}
            <span>{formatDateTime(mission.scheduledStartAt, locale)}</span>
          </span>
        </>
      }
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
