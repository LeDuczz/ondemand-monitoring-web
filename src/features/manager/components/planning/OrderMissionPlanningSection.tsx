import { useCallback, useEffect, useRef, useState } from 'react'
import type { OrderDetail } from '../../types/orders'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { ordersApi } from '../../api/ordersApi'
import { planningApi } from '../../api/planningApi'
import { planningError } from '../../lib/planningErrors'
import { ExecutionPlanSummary } from './ExecutionPlanSummary'
import { MissionPlanningCard } from './MissionPlanningCard'
import { PlanningHeader } from './PlanningHeader'
import { MissionChecklistAssignmentEditor } from './MissionChecklistAssignmentEditor'
import { ManagerMissionStopFlow } from './ManagerMissionStopFlow'
import { MissionSelector } from './MissionSelector'
import { OrderResourceAssignmentWizard } from './OrderResourceAssignmentWizard'
import { CreateMissionPage } from '../../pages/CreateMissionPage'
import './planning.css'
import { useI18n } from '../../../../shared/i18n'
import { planningPresentationMessages } from './planningPresentation.messages'
import { MissionExecutionPanel } from './MissionExecutionPanel'
import { assignmentReadiness } from '../../lib/assignmentReadiness'
import { usePlanningConfirmation } from './usePlanningConfirmation'
import { finalizeError } from '../../lib/planningErrors'
import { ApiError } from '../../../../shared/api/httpClient'

export function OrderMissionPlanningSection({
  orderId,
  initialOrder,
  onAssignResources,
}: {
  orderId: string
  initialOrder?: OrderDetail
  onAssignResources?: (missionId: string) => void
}) {
  return (
    <OrderPlanningWorkspace
      key={orderId}
      orderId={orderId}
      initialOrder={initialOrder}
      onAssignResources={onAssignResources}
    />
  )
}

function OrderPlanningWorkspace({
  orderId,
  initialOrder,
  onAssignResources,
}: {
  orderId: string
  initialOrder?: OrderDetail
  onAssignResources?: (missionId: string) => void
}) {
  const { t } = useI18n(planningPresentationMessages)
  const confirmation = usePlanningConfirmation()
  const initialOrderRef = useRef(
    initialOrder?.id === orderId ? initialOrder : undefined,
  )
  const query = useApiQuery(
    async (signal) => {
      const [plan, missions, order] = await Promise.all([
        planningApi.getExecutionPlan(orderId, signal),
        planningApi.getOrderMissions(orderId, signal),
        initialOrderRef.current ?? ordersApi.getOrder(orderId, signal),
      ])
      // Reuse only the initial exact-Order read. Every later refresh remains authoritative.
      // An aborted StrictMode/dependency request must not consume the initial snapshot.
      if (!signal.aborted) initialOrderRef.current = undefined
      return { plan, missions, order }
    },
    [orderId],
  )
  const [assigningResources, setAssigningResources] = useState<{
    missionId?: string
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
  const allAssigned = writablePlanComplete()
  function writablePlanComplete() {
    return Boolean(
      data &&
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
    Boolean(data && ['APPROVED', 'IN_PROGRESS'].includes(data.order.status))
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
              title: 'Chốt kế hoạch?',
              body: 'Sau khi chốt, cấu trúc Mission và phân công checklist của phiên bản hiện tại sẽ được cố định.',
              action: 'Chốt kế hoạch',
            }
          : {
              title:
                action === 'amend' ? 'Điều chỉnh kế hoạch?' : 'Hủy Mission?',
              body:
                action === 'amend'
                  ? 'Mở phiên bản kế hoạch mới để thay đổi cấu trúc Mission. Lịch sử vẫn được giữ nguyên.'
                  : 'Mission sẽ được hủy và giữ lại trong lịch sử.',
              action:
                action === 'amend' ? 'Điều chỉnh kế hoạch' : 'Hủy Mission',
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
          ? 'Kế hoạch đã được chốt thành công.'
          : 'Đã cập nhật kế hoạch.',
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
          <button
            type="button"
            className="odm-btn"
            disabled={busy || saving || query.loading}
            onClick={query.reload}
          >
            Tải lại kế hoạch
          </button>
        }
      />
      {query.loading && <p role="status">Đang tải kế hoạch…</p>}
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
          {allAssigned && (
            <div className="odm-planning-complete" role="status">
              <span>✓ Tất cả Mission đã được phân công đầy đủ.</span>
              <a className="odm-btn odm-btn-p" href="#portal/manager/orders">
                Hoàn tất phân công
              </a>
            </div>
          )}
          {writable && (
            <div className="odm-planning-actions">
              {writable && data.plan.planStatus === 'DRAFT' && (
                <>
                  <button
                    type="button"
                    className="odm-btn"
                    disabled={busy || saving}
                    onClick={() => setCreating({})}
                  >
                    Tạo thêm Mission
                  </button>
                  <button
                    className="odm-btn odm-btn-p"
                    disabled={
                      busy ||
                      saving ||
                      dirty ||
                      !data.plan.coverage.coverageReady ||
                      data.plan.blockers.length > 0
                    }
                    onClick={() => void mutate('finalize')}
                  >
                    Chốt kế hoạch
                  </button>
                </>
              )}
              {writable &&
                data.plan.planStatus === 'FINALIZED' &&
                !amending && (
                  <button
                    className="odm-btn"
                    disabled={busy}
                    onClick={() => {
                      setAmending(true)
                      setReason('')
                    }}
                  >
                    Điều chỉnh kế hoạch
                  </button>
                )}
            </div>
          )}
          {dirty && (
            <p className="odm-mission-meta" role="status">
              Thay đổi chưa lưu được giữ riêng theo Mission. Lưu phân công trước
              khi chốt hoặc điều chỉnh kế hoạch.
            </p>
          )}
          {creating && (
            <section aria-label="Tạo Mission trong Order">
              <button
                className="odm-btn"
                type="button"
                onClick={async () => {
                  if (
                    await confirmation.confirm({
                      title: 'Đóng form tạo Mission?',
                      body: 'Dữ liệu chưa gửi sẽ không được lưu.',
                      action: 'Đóng form',
                    })
                  )
                    setCreating(null)
                }}
              >
                Đóng form tạo Mission
              </button>
              <CreateMissionPage
                orderId={orderId}
                replacesMissionId={creating.replacesMissionId}
                onCreated={(id) => {
                  setSelectedId(id)
                  setCreating(null)
                  query.reload()
                }}
              />
            </section>
          )}
          {amending && (
            <form
              className="odm-planning-adjustment"
              onSubmit={(e) => {
                e.preventDefault()
                void mutate('amend')
              }}
            >
              <h3>Điều chỉnh kế hoạch</h3>
              <p>
                Mở lại kế hoạch để thêm hoặc thay thế Mission. Lịch sử thực thi
                vẫn được giữ nguyên.
              </p>
              <label>
                Lý do điều chỉnh kế hoạch
                <textarea
                  required
                  autoFocus
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button
                className="odm-btn odm-btn-p"
                disabled={busy || !reason.trim()}
              >
                Xác nhận điều chỉnh
              </button>
              <button
                type="button"
                className="odm-btn"
                onClick={() => setAmending(false)}
              >
                Đóng
              </button>
            </form>
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
              onSelect={setSelectedId}
            />
            <div className="odm-workspace-panels">
              {data.missions.map((mission) => {
                const scope = data.plan.missions.find(
                  (m) => m.missionId === mission.id,
                )
                const draft = data.plan.planStatus === 'DRAFT'
                return (
                  <div key={mission.id} hidden={mission.id !== selected}>
                    <MissionPlanningCard
                      mission={mission}
                      scope={scope}
                      missions={data.missions}
                      key={mission.id}
                    >
                      <MissionChecklistAssignmentEditor
                        missionId={mission.id}
                        revision={data.plan.revision}
                        editable={
                          writable &&
                          !busy &&
                          draft &&
                          scope?.finalizedPlanRevision == null &&
                          mission.status === 'RESOURCE_ASSIGNING'
                        }
                        items={data.order.checklistItems ?? []}
                        onChanged={query.reload}
                        onDraftState={updateDraft}
                      />
                      {writable &&
                        !busy &&
                        runtimeBlocked[mission.id] === false &&
                        data.plan.planStatus === 'FINALIZED' &&
                        (scope?.finalizedPlanRevision ?? 0) > 0 &&
                        [
                          'RESOURCE_ASSIGNING',
                          'WAITING_CREW_CONFIRMATION',
                        ].includes(mission.status) && (
                          <button
                            className="odm-btn"
                            disabled={busy || saving || dirty}
                            onClick={() =>
                              onAssignResources
                                ? onAssignResources(mission.id)
                                : setAssigningResources({
                                    missionId: mission.id,
                                  })
                            }
                          >
                            {assignmentReadiness(mission).complete
                              ? 'Chỉnh sửa phân công cho'
                              : 'Phân công nguồn lực cho'}{' '}
                            {mission.missionCode}
                          </button>
                        )}
                      {((writable &&
                        !['COMPLETED', 'CANCELLED'].includes(mission.status) &&
                        cancelCapabilities[mission.id] === true &&
                        runtimeBlocked[mission.id] === false) ||
                        (cancelling === mission.id &&
                          runtimeBlocked[mission.id] !== true) ||
                        (writable &&
                          draft &&
                          mission.status === 'CANCELLED')) && (
                        <div className="odm-mission-actions">
                          {writable &&
                            !['COMPLETED', 'CANCELLED'].includes(
                              mission.status,
                            ) &&
                            cancelCapabilities[mission.id] === true &&
                            runtimeBlocked[mission.id] === false && (
                              <button
                                className="odm-btn"
                                disabled={busy || saving || dirty}
                                onClick={() => {
                                  setCancelling(mission.id)
                                  setReason('')
                                }}
                              >
                                Hủy Mission {mission.missionCode}
                              </button>
                            )}
                          {cancelling === mission.id &&
                            runtimeBlocked[mission.id] !== true && (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault()
                                  void mutate('cancel', mission.id)
                                }}
                              >
                                <label>
                                  Lý do hủy {mission.missionCode}
                                  <textarea
                                    required
                                    maxLength={1000}
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                  />
                                </label>
                                <button
                                  className="odm-btn"
                                  disabled={
                                    busy ||
                                    !reason.trim() ||
                                    !writable ||
                                    cancelCapabilities[mission.id] !== true
                                  }
                                >
                                  Xác nhận hủy Mission
                                </button>
                                <button
                                  type="button"
                                  className="odm-btn"
                                  onClick={() => setCancelling(null)}
                                >
                                  Đóng
                                </button>
                              </form>
                            )}
                          {writable &&
                            draft &&
                            mission.status === 'CANCELLED' && (
                              <button
                                type="button"
                                className="odm-btn"
                                disabled={busy || saving}
                                onClick={() =>
                                  setCreating({ replacesMissionId: mission.id })
                                }
                              >
                                Tạo Mission thay thế cho {mission.missionCode}
                              </button>
                            )}
                        </div>
                      )}
                      <ManagerMissionStopFlow
                        missionId={mission.id}
                        missionCode={mission.missionCode || 'Mission'}
                        status={mission.status}
                        revision={data.plan.revision}
                        refreshKey={data}
                        writable={writable}
                        draft={draft}
                        active={mission.id === selected}
                        blocked={busy || saving || dirty}
                        onChanged={query.reload}
                        onCapabilitiesChanged={updateCancelCapability}
                        onRuntimeBlocked={updateRuntimeBlocked}
                        onBusyChanged={updateDraft}
                        onReplacement={(id) =>
                          setCreating({ replacesMissionId: id })
                        }
                      />
                      {mission.id === selected &&
                        scope?.finalizedPlanRevision != null && (
                          <MissionExecutionPanel
                            key={mission.id}
                            mission={mission}
                          />
                        )}
                    </MissionPlanningCard>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
