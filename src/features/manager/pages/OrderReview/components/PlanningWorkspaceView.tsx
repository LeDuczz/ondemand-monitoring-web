import { PlanningHeader } from '../../../components/common/PlanningHeader'
import { planningError } from '../../../lib/planningErrors'
import { ExecutionPlanSummary } from './ExecutionPlanSummary'
import { AllAssignedBanner } from './AllAssignedBanner'
import { PlanningActions } from './PlanningActions'
import { CreateMissionSection } from './CreateMissionSection'
import { AmendPlanForm } from './AmendPlanForm'
import { planningPresentationMessages } from '../../../components/common/planningPresentation.messages'
import { MissionWorkspaceGrid } from './MissionWorkspaceGrid'
import { useI18n } from '../../../../../shared/i18n'
import type { Confirmation } from '../../../components/common/usePlanningConfirmation'
import type { ReactNode } from 'react'
import type { PlanningWorkspaceData } from '../planningWorkspaceData'
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
  depositPaid,
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
  continueToResourceAssignment,
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
  data: PlanningWorkspaceData | undefined
  query: UseApiQueryState<PlanningWorkspaceData>
  busy: boolean
  saving: boolean
  message: string
  coverageWarning: string
  allAssigned: boolean
  depositPaid: boolean
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
  continueToResourceAssignment: () => Promise<void>
  setAssigningResources: Dispatch<SetStateAction<{ missionId: string } | null>>
  cancelCapabilities: Record<string, boolean>
  cancelling: string | null
  setCancelling: Dispatch<SetStateAction<string | null>>
  updateCancelCapability: (missionId: string, canCancel: boolean) => void
  updateRuntimeBlocked: (id: string, blocked: boolean) => void
}) {
  const { t, locale } = useI18n(planningWorkspaceViewMessages)

  const { t: planningT } = useI18n(planningPresentationMessages)
  return (
    <section
      className="odm-or-card odm-planning"
      aria-label={t.orderMissionPlanning}
    >
      {confirmation.dialog}
      <PlanningHeader
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
          {!depositPaid && data.order.status === 'APPROVED' ? (
            <div className="odm-planning-payment-gate" role="status">
              <strong>{t.depositWaitingTitle}</strong>
              <p>{t.depositWaitingBody}</p>
              {data.invoice ? (
                <span>
                  {t.depositProgress(
                    data.invoice.paidAmount,
                    data.invoice.depositAmount,
                    locale,
                  )}
                </span>
              ) : (
                <span>{t.noInvoice}</span>
              )}
              <button type="button" className="odm-btn" onClick={query.reload}>
                {t.checkPayment}
              </button>
            </div>
          ) : null}
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
            amending={amending}
            setAmending={setAmending}
            setReason={setReason}
            creating={Boolean(creating)}
            selected={selected}
            onContinue={continueToResourceAssignment}
            onAssignResources={onAssignResources}
            setAssigningResources={setAssigningResources}
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
