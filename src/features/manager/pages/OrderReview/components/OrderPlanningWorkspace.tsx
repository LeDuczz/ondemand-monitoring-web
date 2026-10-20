import type { OrderDetail } from '../../../types/orders'
import { usePlanningConfirmation } from '../../../components/common/usePlanningConfirmation'
import { useRef, useState, useCallback, useEffect } from 'react'
import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../../api/planningApi'
import { ordersApi } from '../../../api/ordersApi'
import { assignmentReadiness } from '../../../lib/assignmentReadiness'
import { ApiError } from '../../../../../shared/api/httpClient'
import { finalizeError, planningError } from '../../../lib/planningErrors'
import { OrderResourceAssignmentWizard } from '../../../components/common/OrderResourceAssignmentWizard'
import { financeApi } from '../../../../finance/api'
import type { PlanningWorkflowInfo } from '../planningWorkspaceData'
import { PlanningWorkspaceView } from './PlanningWorkspaceView'
import { useI18n } from '../../../../../shared/i18n'
import { orderPlanningWorkspaceMessages } from './OrderPlanningWorkspace.messages'

export function OrderPlanningWorkspace({
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
  const { t } = useI18n(orderPlanningWorkspaceMessages)

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
  useEffect(() => {
    if (!data) return
    setSelectedId((id) =>
      data.missions.some((m) => m.id === id)
        ? id
        : (data.missions.at(0)?.id ?? null),
    )
  }, [data])
  const selected = selectedId ?? undefined
  const effective =
    data?.missions.filter((mission) => mission.status !== 'CANCELLED') ?? []
  const depositPaid = Boolean(
    data?.invoice && data.invoice.paidAmount >= data.invoice.depositAmount,
  )
  useEffect(() => {
    if (!data || !onWorkflowInfo) return
    onWorkflowInfo({
      depositPaid,
      selectedMissionId: selectedId,
      missions: effective.map((mission) => ({
        id: mission.id,
        code: mission.missionCode || 'Mission',
        status: mission.status,
      })),
    })
  }, [data, depositPaid, selectedId])
  const allAssigned = writablePlanComplete()
  function writablePlanComplete() {
    return Boolean(
      data &&
      depositPaid &&
      data.plan.planStatus === 'FINALIZED' &&
      effective.length &&
      effective.every(
        (mission) =>
          mission.status !== 'FAILED' && assignmentReadiness(mission).complete,
      ),
    )
  }
  const writable =
    !query.loading &&
    !query.error &&
    Boolean(
      data &&
      depositPaid &&
      ['APPROVED', 'IN_PROGRESS'].includes(data.order.status),
    )
  async function mutate(
    action: 'finalize' | 'amend' | 'cancel',
    missionId?: string,
  ) {
    if (!data || !writable || busy || saving || dirty) return
    if (
      action === 'cancel' &&
      (!missionId || cancelCapabilities[missionId] !== true)
    )
      return
    if (
      !(await confirmation.confirm(
        action === 'finalize'
          ? {
              title: t.finalizeThePlan,
              body: t.sauKhiChotCauTruc,
              action: t.chotKeHoach2,
            }
          : {
              title: action === 'amend' ? t.adjustThePlan : t.cancelTheMission,
              body:
                action === 'amend'
                  ? t.moPhienBanKeHoach
                  : t.theMissionWillBeCancelled,
              action: action === 'amend' ? t.dieuChinhKeHoach2 : t.huyMission2,
            },
      ))
    )
      return
    setBusy(true)
    setMessage('')
    setCoverageWarning('')
    try {
      if (action === 'finalize')
        await planningApi.finalizeExecutionPlan(orderId, data.plan.revision)
      else if (action === 'amend')
        await planningApi.amendExecutionPlan(orderId, {
          expectedPlanRevision: data.plan.revision,
          reason: reason.trim(),
        })
      else if (missionId)
        await planningApi.cancelMission(missionId, {
          expectedPlanRevision: data.plan.revision,
          reason: reason.trim(),
        })
      setAmending(false)
      setCancelling(null)
      setReason('')
      setMessage(
        action === 'finalize'
          ? t.thePlanWasFinalizedSuccessfully
          : t.thePlanHasBeenUpdated,
      )
    } catch (error) {
      if (
        action === 'finalize' &&
        error instanceof ApiError &&
        error.code === 'CHECKLIST_COVERAGE_INCOMPLETE'
      )
        setCoverageWarning(finalizeError(error))
      else
        setMessage(
          action === 'finalize' ? finalizeError(error) : planningError(error),
        )
    } finally {
      setBusy(false)
      query.reload()
    }
  }

  /** Asks VNPAY about pending deposits (the notification may not reach this server), then reloads the plan. */
  async function checkPayment() {
    setMessage('')
    if (!data?.invoice) {
      setMessage(t.noQuoteAccepted)
      query.reload()
      return
    }
    setCheckingPayment(true)
    try {
      await financeApi.refreshOrderPayments(orderId)
      setMessage(t.paymentReconciled)
    } catch (cause) {
      setMessage(planningError(cause))
    } finally {
      setCheckingPayment(false)
      query.reload()
    }
  }

  async function continueToResourceAssignment() {
    if (!data || !selected || !onAssignResources || !writable || busy || saving)
      return
    if (dirty) {
      setCoverageWarning(t.saveChecklistFirst)
      return
    }
    if (!data.plan.coverage.coverageReady || data.plan.blockers.length > 0) {
      setCoverageWarning(t.checklistNotCovered)
      return
    }
    setBusy(true)
    setMessage('')
    setCoverageWarning('')
    try {
      // The backend locks the Mission/checklist structure before resources can
      // be reserved. Keep that technical transition inside the Next action so
      // the manager-facing flow remains: schedule -> resources -> confirmation.
      await planningApi.finalizeExecutionPlan(orderId, data.plan.revision)
      onAssignResources(selected)
    } catch (error) {
      setCoverageWarning(finalizeError(error))
      setBusy(false)
      query.reload()
    }
  }
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
    <PlanningWorkspaceView
      confirmation={confirmation}
      data={data}
      query={query}
      busy={busy}
      saving={saving}
      message={message}
      coverageWarning={coverageWarning}
      allAssigned={allAssigned}
      depositPaid={depositPaid}
      checkingPayment={checkingPayment}
      onCheckPayment={() => void checkPayment()}
      writable={writable}
      setCreating={setCreating}
      dirty={dirty}
      mutate={mutate}
      amending={amending}
      setAmending={setAmending}
      setReason={setReason}
      creating={creating}
      orderId={orderId}
      setSelectedId={setSelectedId}
      reason={reason}
      selected={selected}
      drafts={drafts}
      updateDraft={updateDraft}
      runtimeBlocked={runtimeBlocked}
      onAssignResources={onAssignResources}
      continueToResourceAssignment={continueToResourceAssignment}
      setAssigningResources={setAssigningResources}
      cancelCapabilities={cancelCapabilities}
      cancelling={cancelling}
      setCancelling={setCancelling}
      updateCancelCapability={updateCancelCapability}
      updateRuntimeBlocked={updateRuntimeBlocked}
    />
  )
}
