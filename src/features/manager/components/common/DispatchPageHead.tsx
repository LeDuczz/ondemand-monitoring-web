import type { Mission } from '../../../mission/types/mission'
import { managerHref } from '../../routes'
import { liveDispatchPageMessages } from './LiveDispatchPage.messages'
import { commonMiscMessages } from './commonMisc.messages'
import { missionStatusLabel } from './liveDispatchHelpers'
import { useI18n } from '../../../../shared/i18n'
import type { OrderDispatchContext } from './liveDispatchTypes'
import { Button, PageHeader, StatusBadge } from '../../../../shared/components/ui'

export function DispatchPageHead({
  orderContext,
  current,
  busy,
}: {
  orderContext: OrderDispatchContext | undefined
  current: Mission
  busy: boolean
}) {
  const { t } = useI18n(liveDispatchPageMessages)
  const { t: m } = useI18n(commonMiscMessages)
  return (
    <PageHeader
      title={t.createMissionTitle}
      subtitle={
        orderContext ? (
          <span className="mgr-badge-row">
            <span>{current.missionCode}</span>
            <StatusBadge tone="info">
              {missionStatusLabel(current.status, t.missionStatuses)}
            </StatusBadge>
          </span>
        ) : (
          t.createMissionSubtitle
        )
      }
      actions={
        orderContext ? (
          <Button disabled={busy} onClick={() => orderContext.onReturn()}>
            {orderContext.missionScoped
              ? orderContext.returnLabel
              : m.chooseOtherMission}
          </Button>
        ) : (
          <Button href={managerHref({ screen: 'orderQueue' })}>
            {t.backToOrders}
          </Button>
        )
      }
    />
  )
}
