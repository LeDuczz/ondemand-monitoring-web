import { useCallback, useEffect, useRef, useState } from 'react'
import type { OrderDetail } from '../../../types/orders'
import type { MissionStatus } from '../../../../../shared/types/domain'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { ordersApi } from '../../../api/ordersApi'
import { planningApi } from '../../../api/planningApi'
import { planningError } from '../../../lib/planningErrors'
import { ExecutionPlanSummary } from './ExecutionPlanSummary'
import { PlanningHeader } from '../../../components/common/PlanningHeader'
import { MissionSelector } from './MissionSelector'
import { OrderResourceAssignmentWizard } from '../../../components/common/OrderResourceAssignmentWizard'
import '../../../components/common/planning.css'
import { useI18n } from '../../../../../shared/i18n'
import { planningPresentationMessages } from '../../../components/common/planningPresentation.messages'
import { usePlanningConfirmation } from '../../../components/common/usePlanningConfirmation'
import { ApiError } from '../../../../../shared/api/httpClient'
import { financeApi } from '../../../../finance/api'
import { useOrderPlanning } from '../useOrderPlanning'
import { PlanningPaymentGate } from './PlanningPaymentGate'
import { PlanningActions } from './PlanningActions'
import { PlanningCreatePanel } from './PlanningCreatePanel'
import { PlanningAdjustmentForm } from './PlanningAdjustmentForm'
import { PlanningMissionItem } from './PlanningMissionItem'
import { managerHref } from '../../../routes'
import { Button } from '../../../../../shared/components/ui'
import { orderMissionPlanningSectionMessages } from './OrderMissionPlanningSection.messages'

/** What the page header needs to draw the Order/Mission workflow honestly. */
export type PlanningWorkflowInfo = {
  depositPaid: boolean
  selectedMissionId: string | null
  missions: Array<{ id: string; code: string; status: MissionStatus }>
}

export function OrderMissionPlanningSection({
  orderId,
  initialOrder,
  onAssignResources,
  onWorkflowInfo,
}: {
  orderId: string
  initialOrder?: OrderDetail
  onAssignResources?: (missionId: string) => void
  onWorkflowInfo?: (info: PlanningWorkflowInfo) => void
}) {
  return (
    <OrderPlanningWorkspace
      key={orderId}
      orderId={orderId}
      initialOrder={initialOrder}
      onAssignResources={onAssignResources}
      onWorkflowInfo={onWorkflowInfo}
    />
  )
}

function OrderPlanningWorkspace({
  orderId,
  initialOrder,
  onAssignResources,
  onWorkflowInfo,
}: {
  orderId: string
  initialOrder?: OrderDetail
  onAssignResources?: (missionId: string) => void
  onWorkflowInfo?: (info: PlanningWorkflowInfo) => void
}) {
  const { t } = useI18n(planningPresentationMessages)
  const { t: ts } = useI18n(orderMissionPlanningSectionMessages)
  const confirmation = usePlanningConfirmation()
  const initialOrderRef = useRef(
    initialOrder?.id === orderId ? initialOrder : undefined,
  )
  const query = useApiQuery(
    async (signal) => {
      const [plan, missions, order, invoice] = await Promise.all([
        planningApi.getExecutionPlan(orderId, signal),
        planningApi.getOrderMissions(orderId, signal),
        initialOrderRef.current ?? ordersApi.getOrder(orderId, signal),
        financeApi.getManagerInvoice(orderId, signal).catch((error) => {
          if (error instanceof ApiError && error.status === 404) return null
          throw error
        }),
      ])
      // Reuse only the initial exact-Order read. Every later refresh remains authoritative.
      // An aborted StrictMode/dependency request must not consume the initial snapshot.
      if (!signal.aborted) initialOrderRef.current = undefined
      return { plan, missions, order, invoice }
    },
    [orderId],
  )
  const [assigningResources, setAssigningResources] = useState<{
    missionId: string
  } | null>(null)
  const [busy, setBusy] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState<{
    replacesMissionId?: string
  } | null>(null)
  const [drafts, setDrafts] = useState<
    Record<string, { dirty: boolean; busy: boolean }>
  >({})
  const updateDraft = useCallback(
    (id: string, dirty: boolean, saving: boolean) => {
      setDrafts((current) =>
        current[id]?.dirty === dirty && current[id]?.busy === saving
          ? current
          : { ...current, [id]: { dirty, busy: saving } },
      )
    },
    [],
  )
  const saving = Object.values(drafts).some((draft) => draft.busy)
  const dirty = Object.values(drafts).some((draft) => draft.dirty)
  const [message, setMessage] = useState('')
  const [checkingPayment, setCheckingPayment] = useState(false)
  const [coverageWarning, setCoverageWarning] = useState('')
  const [reason, setReason] = useState('')
  const [amending, setAmending] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [cancelCapabilities, setCancelCapabilities] = useState<
    Record<string, boolean>
  >({})
  const [runtimeBlocked, setRuntimeBlocked] = useState<Record<string, boolean>>(
    {},
  )
  const updateRuntimeBlocked = useCallback((id: string, blocked: boolean) => {
    setRuntimeBlocked((current) =>
      current[id] === blocked ? current : { ...current, [id]: blocked },
    )
  }, [])
  const updateCancelCapability = useCallback(
    (missionId: string, canCancel: boolean) => {
      setCancelCapabilities((current) =>
        current[missionId] === canCancel
          ? current
          : { ...current, [missionId]: canCancel },
      )
    },
    [],
  )
  const data = query.data
  const selectMission = useCallback(
    (missionId: string) => {
      const mission = data?.missions.find((item) => item.id === missionId)
      if (
        mission &&
        [
          'IN_FLIGHT',
          'IN_PROGRESS',
          'RETURNING',
          'POSTFLIGHT_CHECKING',
          'PENDING_REVIEW',
          'COMPLETED',
        ].includes(mission.status)
      ) {
        window.location.hash = managerHref({
          screen: 'missionDetail',
          missionId,
        })
        return
      }
      setSelectedId(missionId)
    },
    [data?.missions],
  )
  useEffect(() => {
    if (!data) return
    setSelectedId((id) =>
      data.missions.some((m) => m.id === id)
        ? id
        : (data.missions.at(0)?.id ?? null),
    )
  }, [data])
  const {
    selected,
    depositPaid,
    allAssigned,
    writable,
    mutate,
    checkPayment,
    continueToResourceAssignment,
  } = useOrderPlanning({
    selectedId,
    data,
    onWorkflowInfo,
    query,
    busy,
    saving,
    dirty,
    cancelCapabilities,
    confirmation,
    setBusy,
    setMessage,
    setCoverageWarning,
    orderId,
    reason,
    setAmending,
    setCancelling,
    setReason,
    setCheckingPayment,
    onAssignResources,
  })
  if (assigningResources)
    return (
      <OrderResourceAssignmentWizard
        orderId={orderId}
        initialMissionId={assigningResources.missionId}
        onClose={() => {
          setAssigningResources(null)
          query.reload()
        }}
      />
    )
  return (
    <section
      className="odm-or-card odm-planning"
      aria-label="Order Mission planning"
    >
      {confirmation.dialog}
      <PlanningHeader
        primary
        status={data?.plan.planStatus}
        revision={data?.plan.revision ?? 0}
        loading={query.loading}
        action={
          <Button
            type="button"
            disabled={busy || saving || query.loading}
            onClick={query.reload}
          >
            {ts.reloadPlan}
          </Button>
        }
      />
      {query.loading && <p role="status">{ts.loadingPlan}</p>}
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
            <PlanningPaymentGate
              checkingPayment={checkingPayment}
              checkPayment={checkPayment}
              data={data}
            />
          ) : null}
          {coverageWarning && (
            <p role="alert" className="odm-planning-notice">
              {coverageWarning}
            </p>
          )}
          {allAssigned && (
            <div className="odm-planning-complete" role="status">
              <span>{ts.allAssigned}</span>
              <Button variant="primary" href="#portal/manager/orders">
                {ts.backToOrders}
              </Button>
            </div>
          )}
          {writable && (
            <PlanningActions
              writable={writable}
              data={data}
              busy={busy}
              saving={saving}
              creating={creating}
              setCreating={setCreating}
              continueToResourceAssignment={continueToResourceAssignment}
              amending={amending}
              setAmending={setAmending}
              setReason={setReason}
              selected={selected}
              dirty={dirty}
              onAssignResources={onAssignResources}
              setAssigningResources={setAssigningResources}
            />
          )}
          {dirty && (
            <p className="odm-mission-meta" role="status">
              {ts.unsavedPerMission}
            </p>
          )}
          {creating && (
            <PlanningCreatePanel
              confirmation={confirmation}
              setCreating={setCreating}
              orderId={orderId}
              creating={creating}
              setSelectedId={setSelectedId}
              query={query}
            />
          )}
          {amending && (
            <PlanningAdjustmentForm
              mutate={mutate}
              reason={reason}
              setReason={setReason}
              busy={busy}
              setAmending={setAmending}
            />
          )}
          {data.missions.length === 0 && (
            <div className="odm-plan-empty">
              <h3>{t.empty}</h3>
              <p>{t.emptyHint}</p>
            </div>
          )}
          <div className="odm-planning-workspace">
            <MissionSelector
              missions={data.missions}
              plan={data.plan}
              selectedId={selected}
              noChecklist={!data.order.checklistItems?.length}
              disabled={busy || saving}
              drafts={drafts}
              onSelect={selectMission}
            />
            <div className="odm-workspace-panels">
              {data.missions.map((mission) => {
                const scope = data.plan.missions.find(
                  (m) => m.missionId === mission.id,
                )
                const draft = data.plan.planStatus === 'DRAFT'
                return (
                  <PlanningMissionItem
                    key={mission.id}
                    mission={mission}
                    selected={selected}
                    scope={scope}
                    data={data}
                    writable={writable}
                    busy={busy}
                    draft={draft}
                    query={query}
                    updateDraft={updateDraft}
                    cancelCapabilities={cancelCapabilities}
                    runtimeBlocked={runtimeBlocked}
                    cancelling={cancelling}
                    saving={saving}
                    dirty={dirty}
                    setCancelling={setCancelling}
                    setReason={setReason}
                    mutate={mutate}
                    reason={reason}
                    setCreating={setCreating}
                    updateCancelCapability={updateCancelCapability}
                    updateRuntimeBlocked={updateRuntimeBlocked}
                  />
                )
              })}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
