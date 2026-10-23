import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { managerHref } from '../../../routes'
import { OrderIcon } from '../../../components/common/OrderIcon'
import { missionDetailPageMessages } from '../MissionDetailPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionResponse } from '../../../types/missions'
import { Button, PageHeader } from '../../../../../shared/components/ui'

export function MissionDetailHeader({
  mission,
  headline,
  canSetup,
}: {
  mission: MissionResponse
  headline: string | null
  canSetup: boolean
}) {
  const { t } = useI18n(missionDetailPageMessages)
  return (
    <PageHeader
      back={
        <a href={managerHref({ screen: 'missions' })}>
          <OrderIcon name="arrow-right" size={14} />
          {t.back}
        </a>
      }
      title={
        <span className="mgr-badge-row">
          <span className="odm-mono">{mission.missionCode}</span>
          {missionStopLabel(mission) ? (
            <StatusBadge tone="yellow">{missionStopLabel(mission)}</StatusBadge>
          ) : (
            <StatusBadge
              kind="mission"
              status={mission.status}
              tone={missionStatusTone[mission.status]}
            />
          )}
        </span>
      }
      subtitle={headline ?? t.noDescription}
      actions={
        <div className="mgr-header-actions">
          <Button
            href={managerHref({
              screen: 'orderReview',
              orderId: mission.orderId,
            })}
          >
            {t.viewOrderPlan}
            <OrderIcon name="arrow-right" size={13} />
          </Button>
          {canSetup ? (
            <Button
              variant="primary"
              href={managerHref({
                screen: 'missionSetup',
                missionId: mission.id,
              })}
            >
              {t.continueSetup}
            </Button>
          ) : null}
        </div>
      }
    />
  )
}
