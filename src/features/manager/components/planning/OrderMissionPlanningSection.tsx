import { useCallback, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { ordersApi } from '../../api/ordersApi'
import { planningApi } from '../../api/planningApi'
import { planningError } from '../../lib/planningErrors'
import { managerHref } from '../../routes'
import { ExecutionPlanSummary } from './ExecutionPlanSummary'
import { MissionChecklistAssignmentEditor } from './MissionChecklistAssignmentEditor'
import { SafeStopPanel } from './SafeStopPanel'
import './planning.css'

export function OrderMissionPlanningSection({ orderId }: { orderId: string }) {
  const query = useApiQuery(
    async (signal) => {
      const [plan, missions, order] = await Promise.all([
        planningApi.getExecutionPlan(orderId, signal),
        planningApi.getOrderMissions(orderId, signal),
        ordersApi.getOrder(orderId, signal),
      ])
      return { plan, missions, order }
    },
    [orderId],
  )
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [reason, setReason] = useState('')
  const [amending, setAmending] = useState(false)
  const [cancelling, setCancelling] = useState<string | null>(null)
  const [cancelCapabilities, setCancelCapabilities] = useState<
    Record<string, boolean>
  >({})
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
  const writable =
    !query.loading &&
    !query.error &&
    Boolean(data && ['APPROVED', 'IN_PROGRESS'].includes(data.order.status))
  async function mutate(
    action: 'finalize' | 'amend' | 'cancel',
    missionId?: string,
  ) {
    if (!data || !writable || busy) return
    if (
      action === 'cancel' &&
      (!missionId || cancelCapabilities[missionId] !== true)
    )
      return
    const target = missionId ? `Mission ${missionId}` : `Order ${orderId}`
    if (
      !window.confirm(
        `Xác nhận ${action} ${target}? ${action === 'finalize' ? `${data.plan.missions.length} Mission; coverage ${data.plan.coverage.covered}/${data.plan.coverage.total}.` : ''}`,
      )
    )
      return
    setBusy(true)
    setMessage('')
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
      setMessage('Thao tác thành công; đang tải lại trạng thái máy chủ.')
    } catch (error) {
      setMessage(planningError(error))
    } finally {
      setBusy(false)
      query.reload()
    }
  }
  return (
    <section
      className="odm-or-card odm-planning"
      aria-label="Order Mission planning"
    >
      <div className="odm-planning-heading">
        <h2>Mission của Order</h2>
        <button
          type="button"
          className="odm-btn"
          disabled={busy || query.loading}
          onClick={query.reload}
        >
          Tải lại kế hoạch
        </button>
      </div>
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
          <div className="odm-planning-actions">
            {writable && data.plan.planStatus === 'DRAFT' && (
              <>
                <a
                  className="odm-btn odm-btn-p"
                  href={managerHref({ screen: 'missionCreate', orderId })}
                >
                  Tạo thêm Mission
                </a>
                <button
                  className="odm-btn"
                  disabled={
                    busy ||
                    !data.plan.coverage.coverageReady ||
                    data.plan.blockers.length > 0
                  }
                  onClick={() => void mutate('finalize')}
                >
                  Chốt kế hoạch
                </button>
              </>
            )}
            {writable && data.plan.planStatus === 'FINALIZED' && (
              <button
                className="odm-btn"
                disabled={busy}
                onClick={() => {
                  setAmending(true)
                  setReason('')
                }}
              >
                Mở amendment
              </button>
            )}
          </div>
          {amending && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void mutate('amend')
              }}
            >
              <p>
                Amendment chỉ mở lại planning. Không rollback runtime hoặc lịch
                sử Mission đã chốt.
              </p>
              <label>
                Lý do amendment
                <textarea
                  required
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button className="odm-btn" disabled={busy || !reason.trim()}>
                Xác nhận amendment
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
            <p>Chưa có Mission. Tạo Mission planning để bắt đầu phân công.</p>
          )}
          {data.missions.map((mission) => {
            const scope = data.plan.missions.find(
              (m) => m.missionId === mission.id,
            )
            const draft = data.plan.planStatus === 'DRAFT'
            return (
              <article className="odm-planning-mission" key={mission.id}>
                <div className="odm-planning-heading">
                  <h3>
                    <a
                      href={managerHref({
                        screen: 'missionDetail',
                        missionId: mission.id,
                      })}
                    >
                      {mission.missionCode || mission.id}
                    </a>
                  </h3>
                  <span>{mission.status}</span>
                </div>
                <p>
                  {scope?.scopeLabel ??
                    'Mission ngoài effective plan / lịch sử'}
                </p>
                {mission.replacesMissionId && (
                  <p>
                    Replacement cho{' '}
                    <a
                      href={managerHref({
                        screen: 'missionDetail',
                        missionId: mission.replacesMissionId,
                      })}
                    >
                      {data.missions.find(
                        (m) => m.id === mission.replacesMissionId,
                      )?.missionCode || mission.replacesMissionId}
                    </a>
                    . Không kế thừa evidence hoặc kết quả.
                  </p>
                )}
                {data.missions
                  .filter((m) => m.replacesMissionId === mission.id)
                  .map((replacement) => (
                    <p key={replacement.id}>
                      Được thay thế bởi{' '}
                      <a
                        href={managerHref({
                          screen: 'missionDetail',
                          missionId: replacement.id,
                        })}
                      >
                        {replacement.missionCode || replacement.id}
                      </a>
                    </p>
                  ))}
                <p>
                  {mission.scheduledStartAt
                    ? new Date(mission.scheduledStartAt).toLocaleString()
                    : 'Chưa có lịch'}{' '}
                  →{' '}
                  {mission.scheduledEndAt
                    ? new Date(mission.scheduledEndAt).toLocaleString()
                    : '—'}
                </p>
                <p>
                  {scope?.finalizedPlanRevision != null
                    ? `Đã chốt tại revision ${scope.finalizedPlanRevision}`
                    : scope
                      ? 'Planning / chưa có revision chốt'
                      : 'Lịch sử — API hiện không trả metadata chốt của Mission này'}{' '}
                  · Thiết bị:{' '}
                  {mission.deviceName ?? mission.deviceCode ?? 'Chưa phân công'}{' '}
                  · Crew:{' '}
                  {mission.staffAssignments
                    ?.map(
                      (a) => `${a.staffName ?? a.staffId} (${a.assignedRole})`,
                    )
                    .join(', ') || 'Chưa phân công'}
                </p>
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
                />
                {writable && cancelCapabilities[mission.id] === true && (
                  <button
                    className="odm-btn"
                    disabled={busy}
                    onClick={() => {
                      setCancelling(mission.id)
                      setReason('')
                    }}
                  >
                    Hủy Mission {mission.missionCode}
                  </button>
                )}
                {cancelling === mission.id && (
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
                {writable && draft && mission.status === 'CANCELLED' && (
                  <a
                    className="odm-btn"
                    href={managerHref({
                      screen: 'missionCreate',
                      orderId,
                      replacesMissionId: mission.id,
                    })}
                  >
                    Tạo replacement cho {mission.missionCode}
                  </a>
                )}
                <SafeStopPanel
                  missionId={mission.id}
                  revision={data.plan.revision}
                  manager
                  onChanged={query.reload}
                  onCapabilitiesChanged={updateCancelCapability}
                />
              </article>
            )
          })}
        </>
      )}
    </section>
  )
}
