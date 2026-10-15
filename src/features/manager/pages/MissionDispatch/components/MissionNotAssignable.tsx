import { Card } from '../../../../../shared/components/ui'
import type { OrderDispatchContext } from '../orderDispatchContext'
import { useI18n } from '../../../../../shared/i18n'
import { missionNotAssignableMessages } from './MissionNotAssignable.messages'
import '../missionDispatch.css'

export function MissionNotAssignable({
  orderContext,
}: {
  orderContext: OrderDispatchContext
}) {
  const { t } = useI18n(missionNotAssignableMessages)

  return (
    <Card>
      <div className="odm-dp-notice">
        <p role="alert">{t.nhiemVuKhongConDu}</p>
        <button className="odm-btn" onClick={() => orderContext.onReturn()}>
          {orderContext.missionScoped
            ? orderContext.returnLabel
            : t.chooseAnotherMission}
        </button>
      </div>
    </Card>
  )
}
