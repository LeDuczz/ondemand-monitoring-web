import type { usePlanningConfirmation } from '../../../components/common/usePlanningConfirmation'
import { MissionCreatePage } from '../../MissionCreate/MissionCreatePage'
import type { Dispatch, SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import type { OrderDetail } from '../../../types/orders'
import type { Invoice } from '../../../../finance/types'
import { useI18n } from '../../../../../shared/i18n'
import { planningCreatePanelMessages } from './PlanningCreatePanel.messages'

export function PlanningCreatePanel({
  confirmation,
  setCreating,
  orderId,
  creating,
  setSelectedId,
  query,
}: {
  confirmation: ReturnType<typeof usePlanningConfirmation>
  setCreating: Dispatch<
    SetStateAction<{ replacesMissionId?: string | undefined } | null>
  >
  orderId: string
  creating: { replacesMissionId?: string | undefined }
  setSelectedId: Dispatch<SetStateAction<string | null>>
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    invoice: Invoice | null
  }>
}) {
  const { t } = useI18n(planningCreatePanelMessages)
  return (
    <section className="odm-planning-create-panel" aria-label={t.panelLabel}>
      <header className="odm-planning-create-head">
        <span className="odm-planning-create-icon" aria-hidden="true">
          ＋
        </span>
        <div>
          <h3>{t.title}</h3>
          <p>{t.intro}</p>
        </div>
        <button
          className="odm-planning-create-close"
          type="button"
          aria-label={t.closeFormLabel}
          title={t.closeFormTitle}
          onClick={async () => {
            if (
              await confirmation.confirm({
                title: t.confirmTitle,
                body: t.confirmBody,
                action: t.confirmAction,
              })
            )
              setCreating(null)
          }}
        >
          ×
        </button>
      </header>
      <MissionCreatePage
        orderId={orderId}
        replacesMissionId={creating.replacesMissionId}
        onCreated={(id) => {
          setSelectedId(id)
          setCreating(null)
          query.reload()
        }}
      />
    </section>
  )
}
