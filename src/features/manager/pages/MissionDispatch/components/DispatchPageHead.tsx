import {
  PageHeader,
  StatusBadge,
  toUiTone,
} from '../../../../../shared/components/ui'
import {
  getMissionStatusLabel,
  missionStatusTone,
} from '../../../../../shared/lib/statusTone'
import { managerHref } from '../../../routes'
import type { OrderDispatchContext } from '../orderDispatchContext'
import type { Mission } from '../../../../mission/types/mission'
import { useI18n } from '../../../../../shared/i18n'
import { dispatchPageHeadMessages } from './DispatchPageHead.messages'

/** Back link, mission code and status badge. */
export function DispatchPageHead({
  orderContext,
  current,
  busy,
}: {
  orderContext: OrderDispatchContext | undefined
  current: Mission
  busy: boolean
}) {
  const { t, lang } = useI18n(dispatchPageHeadMessages)
  const back = orderContext ? (
    <button
      type="button"
      className="odm-dp-back"
      disabled={busy}
      onClick={() => orderContext.onReturn()}
    >
      {orderContext.missionScoped
        ? orderContext.returnLabel
        : t.chooseAnotherMission}
    </button>
  ) : (
    <a href={managerHref({ screen: 'orderQueue' })}>{t.backToOrders}</a>
  )
  return (
    <PageHeader
      back={back}
      title={t.createMissionTitle}
      subtitle={
        <>
          <span className="odm-mono">{current.missionCode}</span>
          {' · '}
          {t.createMissionSubtitle}
        </>
      }
      actions={
        <StatusBadge
          tone={toUiTone(missionStatusTone[current.status] ?? 'gray')}
        >
          {getMissionStatusLabel(current.status, lang) ?? current.status}
        </StatusBadge>
      }
    />
  )
}
