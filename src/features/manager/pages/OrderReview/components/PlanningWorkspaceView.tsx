import { PlanningHeader } from '../../../components/common/PlanningHeader'
import { planningError } from '../../../lib/planningErrors'
import { ExecutionPlanSummary } from './ExecutionPlanSummary'
import { AllAssignedBanner } from './AllAssignedBanner'
import { PlanningActions } from './PlanningActions'
import { CreateMissionSection } from './CreateMissionSection'
import { AmendPlanForm } from './AmendPlanForm'
import { planningPresentationMessages } from '../../../components/common/planningPresentation.messages'
import { MissionWorkspaceGrid } from './MissionWorkspaceGrid'
import type { OrderDetail } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import type { Confirmation } from '../../../components/common/usePlanningConfirmation'
import type { ReactNode } from 'react'
import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { planningWorkspaceViewMessages } from './PlanningWorkspaceView.messages'

export function PlanningWorkspaceView({
  confirmation,
  data,
  query,
  busy,
  saving,
  message,
  coverageWarning,
  allAssigned,
  writable,
  setCreating,
  dirty,
  mutate,
  amending,
  setAmending,
  setReason,
  creating,
  orderId,
  setSelectedId,
  reason,
  selected,
  drafts,
  updateDraft,
  runtimeBlocked,
  onAssignResources,
  setAssigningResources,
  cancelCapabilities,
  cancelling,
  setCancelling,
  updateCancelCapability,
  updateRuntimeBlocked,
}: {
  confirmation: {
    confirm: (next: Confirmation) => Promise<boolean>
    dialog: ReactNode | null
  }
  data:
    | { plan: ExecutionPlan; missions: MissionResponse[]; order: OrderDetail }
    | undefined
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
  }>
  busy: boolean
  saving: boolean
  message: string
  coverageWarning: string
  allAssigned: boolean
  writable: boolean
  setCreating: Dispatch<
    SetStateAction<{ replacesMissionId?: string | undefined } | null>
  >
  dirty: boolean
  mutate: (
    action: 'finalize' | 'amend' | 'cancel',
    missionId?: string | undefined,
  ) => Promise<void>
  amending: boolean
  setAmending: Dispatch<SetStateAction<boolean>>
  setReason: Dispatch<SetStateAction<string>>
  creating: { replacesMissionId?: string | undefined } | null
  orderId: string
  setSelectedId: Dispatch<SetStateAction<string | null>>
  reason: string
  selected: string | undefined
  drafts: Record<string, { dirty: boolean; busy: boolean }>
  updateDraft: (id: string, dirty: boolean, saving: boolean) => void
  runtimeBlocked: Record<string, boolean>
  onAssignResources: ((missionId: string) => void) | undefined
  setAssigningResources: Dispatch<
    SetStateAction<{ missionId?: string | undefined } | null>
  >
  cancelCapabilities: Record<string, boolean>
  cancelling: string | null
  setCancelling: Dispatch<SetStateAction<string | null>>
  updateCancelCapability: (missionId: string, canCancel: boolean) => void
  updateRuntimeBlocked: (id: string, blocked: boolean) => void
}) {
  const { t } = useI18n(planningWorkspaceViewMessages)

  const { t: planningT } = useI18n(planningPresentationMessages)
  return (
    <section
      className="odm-or-card odm-planning"
      aria-label={t.orderMissionPlanning}
    >
      {confirmation.dialog}
      <PlanningHeader
        primary
        status={data?.plan.planStatus}
        revision={data?.plan.revision ?? 0}
        loading={query.loading}
        action={
          <button
            type="button"
            className="odm-btn"
            disabled={busy || saving || query.loading}
            onClick={query.reload}
          >
            {t.reloadPlan}
          </button>
        }
      />
      {query.loading && <p role="status">{t.loadingPlan}</p>}
      {query.error ? <p role="alert">{planningError(query.error)}</p> : null}
      {message && (
        <p role="status" className="odm-planning-notice">
          {message}
        </p>
      )}
      {data && !query.error && (
        <>
          <ExecutionPlanSummary
            plan={data.plan}
            items={data.order.checklistItems ?? []}
          />
          {coverageWarning && (
            <p role="alert" className="odm-planning-notice">
              {coverageWarning}
            </p>
          )}
          <AllAssignedBanner allAssigned={allAssigned} />
          <PlanningActions
            writable={writable}
            data={data}
            busy={busy}
            saving={saving}
            setCreating={setCreating}
            dirty={dirty}
            mutate={mutate}
            amending={amending}
            setAmending={setAmending}
            setReason={setReason}
          />
          {dirty && (
            <p className="odm-mission-meta" role="status">
              {t.thayDoiChuaLuuDuoc}
            </p>
          )}
          <CreateMissionSection
            creating={creating}
            confirm={confirmation.confirm}
            setCreating={setCreating}
            orderId={orderId}
            setSelectedId={setSelectedId}
            query={query}
          />
          <AmendPlanForm
            amending={amending}
            mutate={mutate}
            reason={reason}
            setReason={setReason}
            busy={busy}
            setAmending={setAmending}
          />
          {data.missions.length === 0 && (
            <div className="odm-plan-empty">
              <h3>{planningT.empty}</h3>
              <p>{planningT.emptyHint}</p>
            </div>
          )}
          <MissionWorkspaceGrid
            data={data}
            selected={selected}
            busy={busy}
            saving={saving}
            drafts={drafts}
            setSelectedId={setSelectedId}
            writable={writable}
            query={query}
            updateDraft={updateDraft}
            runtimeBlocked={runtimeBlocked}
            dirty={dirty}
            onAssignResources={onAssignResources}
            setAssigningResources={setAssigningResources}
            cancelCapabilities={cancelCapabilities}
            cancelling={cancelling}
            setCancelling={setCancelling}
            setReason={setReason}
            mutate={mutate}
            reason={reason}
            setCreating={setCreating}
            updateCancelCapability={updateCancelCapability}
            updateRuntimeBlocked={updateRuntimeBlocked}
          />
        </>
      )}
    </section>
  )
}
