import { OrderIcon } from '../../../components/common/OrderIcon'
import { managerHref } from '../../../routes'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { missionCreateActionBarMessages } from './MissionCreateActionBar.messages'

export function MissionCreateActionBar({
  handleSubmit,
  submitting,
  planQuery,
  replacementQuery,
  replacesMissionId,
  orderId,
}: {
  handleSubmit: () => Promise<void>
  submitting: boolean
  planQuery: UseApiQueryState<ExecutionPlan>
  replacementQuery: UseApiQueryState<MissionResponse | null>
  replacesMissionId: string | undefined
  orderId: string
}) {
  const { t } = useI18n(missionCreateActionBarMessages)
  return (
    <div className="odm-or-actionbar">
      <p className="odm-or-actionbar-hint">
        <OrderIcon name="info" size={16} />
        <span>{t.actionHint}</span>
      </p>
      <div className="odm-or-actionbar-actions">
        <a className="odm-btn" href={managerHref({ screen: 'orderQueue' })}>
          {t.backToOrders}
        </a>
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={handleSubmit}
          disabled={
            submitting ||
            planQuery.loading ||
            Boolean(planQuery.error) ||
            planQuery.data?.planStatus !== 'DRAFT' ||
            replacementQuery.loading ||
            Boolean(replacementQuery.error) ||
            Boolean(
              replacesMissionId &&
              (replacementQuery.data?.status !== 'CANCELLED' ||
                replacementQuery.data.orderId !== orderId),
            )
          }
        >
          {submitting ? t.creating : t.createMission}
          <OrderIcon name="chevron-right" size={16} />
        </button>
      </div>
    </div>
  )
}
