import { managerHref } from '../../../routes'
import type { OrderDispatchContext } from '../orderDispatchContext'
import type { Mission } from '../../../../mission/types/mission'
import { useI18n } from '../../../../../shared/i18n'
import { dispatchPageHeadMessages } from './DispatchPageHead.messages'

export function DispatchPageHead({
  orderContext,
  current,
  busy,
}: {
  orderContext: OrderDispatchContext | undefined
  current: Mission
  busy: boolean
}) {
  const { t } = useI18n(dispatchPageHeadMessages)
  return (
    <div className="odm-or-pagehead odm-or-pagehead-row">
      <div>
        <h1 className="odm-or-title">{t.createMissionTitle}</h1>
        <p className="odm-or-subtitle">{t.createMissionSubtitle}</p>
        {orderContext && (
          <span className="odm-or-pill odm-or-pill-blue">
            {current.missionCode}
          </span>
        )}
      </div>
      {orderContext ? (
        <button
          className="odm-or-btn-outline"
          disabled={busy}
          onClick={() => orderContext.onReturn()}
        >
          {orderContext.missionScoped
            ? orderContext.returnLabel
            : t.chooseAnotherMission}
        </button>
      ) : (
        <a
          className="odm-or-btn-outline"
          href={managerHref({ screen: 'orderQueue' })}
        >
          {t.backToOrders}
        </a>
      )}
    </div>
  )
}
