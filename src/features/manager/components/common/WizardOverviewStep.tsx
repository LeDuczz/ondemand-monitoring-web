import type { usePlanningConfirmation } from './usePlanningConfirmation'
import { OrderMissionsOverview } from './OrderMissionsOverview'
import type { Dispatch, SetStateAction } from 'react'
import type { ExecutionPlan, SafeStop } from '../../types/planning'
import type { MissionResponse } from '../../types/missions'
import type { OrderDetail } from '../../types/orders'
import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'

export function WizardOverviewStep({
  confirmation,
  data,
  query,
  setCandidateId,
  setActiveId,
  setDraft,
  setReviewing,
  onClose,
  returnLabel,
  embedded,
}: {
  confirmation: ReturnType<typeof usePlanningConfirmation>
  data: {
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    stops: (SafeStop | null)[]
  }
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    stops: (SafeStop | null)[]
  }>
  setCandidateId: Dispatch<SetStateAction<string | null>>
  setActiveId: Dispatch<SetStateAction<string | null>>
  setDraft: Dispatch<SetStateAction<boolean>>
  setReviewing: Dispatch<SetStateAction<boolean>>
  onClose: () => void
  returnLabel: string
  embedded: boolean
}) {
  return (
    <>
      {confirmation.dialog}
      <OrderMissionsOverview
        missions={data.missions}
        scopeLabels={Object.fromEntries(
          data.plan.missions.map((m) => [m.missionId, m.scopeLabel]),
        )}
        loading={query.loading}
        onReload={query.reload}
        onAssignMore={(id) => {
          setCandidateId(id)
          setActiveId(id)
          setDraft(false)
          setReviewing(false)
        }}
        onDone={() => {
          setReviewing(false)
          onClose()
        }}
        doneLabel={returnLabel}
        embedded={embedded}
      />
    </>
  )
}
