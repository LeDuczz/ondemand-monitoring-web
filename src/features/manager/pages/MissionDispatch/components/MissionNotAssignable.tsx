import type { OrderDispatchContext } from '../orderDispatchContext'
import { useI18n } from '../../../../../shared/i18n'
import { missionNotAssignableMessages } from './MissionNotAssignable.messages'

export function MissionNotAssignable({
  orderContext,
}: {
  orderContext: OrderDispatchContext
}) {
  const { t } = useI18n(missionNotAssignableMessages)

  return (
    <section className="odm-or-card odm-or-card-body">
      <p role="alert">{t.nhiemVuKhongConDu}</p>
      <button
        className="odm-or-btn-outline"
        onClick={() => orderContext.onReturn()}
      >
        {orderContext.missionScoped
          ? orderContext.returnLabel
          : t.chooseAnotherMission}
      </button>
    </section>
  )
}
