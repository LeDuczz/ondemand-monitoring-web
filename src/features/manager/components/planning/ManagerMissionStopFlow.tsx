import { useEffect, useRef, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../api/planningApi'
import { Icon } from '../../../../shared/components/Icon'
import {
  SafeStopRefresh,
  SafeStopSummary,
} from '../../../mission/components/SafeStopSummary'
import {
  hasStopRequest,
  managerStopAction,
  safeStopError,
} from '../../../mission/lib/safeStopPresentation'
import { usePlanningConfirmation } from './usePlanningConfirmation'

/** Backend capabilities remain the source of truth; no crew attestation here. */
export function ManagerMissionStopFlow({
  missionId,
  missionCode,
  status,
  revision,
  refreshKey,
  writable,
  draft,
  active,
  blocked,
  onChanged,
  onCapabilitiesChanged,
  onRuntimeBlocked,
  onBusyChanged,
  onReplacement,
}: {
  missionId: string
  missionCode: string
  status: string
  revision: number
  refreshKey: object
  writable: boolean
  draft: boolean
  active: boolean
  blocked: boolean
  onChanged: () => void
  onCapabilitiesChanged: (id: string, allowed: boolean) => void
  onRuntimeBlocked: (id: string, blocked: boolean) => void
  onBusyChanged: (id: string, dirty: boolean, busy: boolean) => void
  onReplacement: (id: string) => void
}) {
  const query = useApiQuery(
    (signal) => planningApi.getSafeStop(missionId, signal),
    [missionId, revision, refreshKey],
  )
  const [intent, setIntent] = useState<'cancel' | 'replace' | null>(null)
  const confirmation = usePlanningConfirmation()
  const flowRef = useRef<HTMLElement>(null)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (intent && active) flowRef.current?.focus()
  }, [intent, active])
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const terminal = ['COMPLETED', 'CANCELLED'].includes(status)
  const stop = query.data
  const ready = (!query.loading || Boolean(stop)) && !query.error && stop?.missionId === missionId
  useEffect(() => {
    onBusyChanged(`stop:${missionId}`, false, busy)
  }, [missionId, busy, onBusyChanged])
  useEffect(() => {
    onCapabilitiesChanged(
      missionId,
      Boolean(ready && !terminal && stop?.canCancelMission === true),
    )
    onRuntimeBlocked(
      missionId,
      Boolean(!ready || terminal || stop?.status || stop?.requestedAt),
    )
  }, [
    missionId,
    ready,
    terminal,
    stop,
    onCapabilitiesChanged,
    onRuntimeBlocked,
  ])
  const allowed = ready && writable && !terminal && active && !blocked && !busy
  const nextAction = ready ? managerStopAction(stop) : null
  const requested = Boolean(stop && hasStopRequest(stop))
  const actionReason = requested
    ? stop?.reason?.trim() || reason.trim()
    : reason.trim()
  function refresh() {
    query.reload()
    onChanged()
  }
  const relevant =
    stop?.canRequestSafeStop === true ||
    stop?.canCleanupSafeStop === true ||
    (Boolean(stop?.status) && typeof stop?.canCancelMission === 'boolean')
  async function command(action: 'request' | 'cleanup' | 'cancel') {
    const permission = {
      request: stop?.canRequestSafeStop,
      cleanup: stop?.canCleanupSafeStop,
      cancel: stop?.canCancelMission,
    }[action]
    if (
      !allowed ||
      permission !== true ||
      action !== nextAction ||
      (action !== 'cleanup' && !actionReason)
    )
      return
    if (
      action !== 'request' &&
      !(await confirmation.confirm({
        title: action === 'cleanup' ? 'Giải phóng tài nguyên?' : 'Hủy Mission?',
        body:
          action === 'cleanup'
            ? `Giải phóng thiết bị và nhân sự của ${missionCode}.`
            : `Hủy ${missionCode} và giữ lại lịch sử.`,
        action: action === 'cleanup' ? 'Giải phóng tài nguyên' : 'Hủy Mission',
      }))
    )
      return
    setBusy(true)
    setMessage('')
    try {
      if (action === 'request')
        await planningApi.requestSafeStop(missionId, {
          expectedPlanRevision: revision,
          reason: actionReason,
        })
      if (action === 'cleanup') await planningApi.cleanupSafeStop(missionId)
      if (action === 'cancel') {
        await planningApi.cancelMission(missionId, {
          expectedPlanRevision: revision,
          reason: actionReason,
        })
        if (intent === 'replace') onReplacement(missionId)
        setIntent(null)
      }
      setMessage('Thao tác đã được ghi nhận.')
    } catch (error) {
      setMessage(safeStopError(error))
    } finally {
      setBusy(false)
      refresh()
    }
  }
  if (terminal) return null
  return (
    <>
      {confirmation.dialog}
      {writable && ready && !intent && !draft && (
        <div className="odm-mission-actions">
          {(stop?.canCancelMission !== true || requested) && relevant && (
            <button
              className="odm-btn odm-btn-danger-soft"
              data-stop-trigger={`${missionId}:cancel`}
              disabled={!allowed}
              onClick={(event) => {
                triggerRef.current = event.currentTarget
                setIntent('cancel')
                query.reload()
              }}
            >
              Hủy Mission {missionCode}
            </button>
          )}
        </div>
      )}
      {intent && (
        <section
          className="odm-manager-stop-flow mission-stop"
          ref={flowRef}
          tabIndex={-1}
          aria-label={`Dừng Mission ${missionCode}`}
          aria-busy={busy || query.loading}
        >
          <div className="mission-stop__header">
            <h4>
              <Icon name="shield" width={18} height={18} />
              {ready && stop?.canCancelMission === true && !requested
                ? 'Xác nhận hủy Mission'
                : 'Dừng Mission an toàn'}
            </h4>
            <div className="mission-stop__header-actions">
              <SafeStopRefresh
                disabled={busy || query.loading}
                onClick={refresh}
              />
              <button
                className="odm-btn"
                disabled={busy}
                onClick={() => {
                  setIntent(null)
                  window.requestAnimationFrame(() => {
                    const button = document.querySelector<HTMLButtonElement>(
                      `[data-stop-trigger="${missionId}:${intent}"]`,
                    )
                    ;(button ?? triggerRef.current)?.focus()
                  })
                }}
              >
                Đóng bảng thao tác
              </button>
            </div>
          </div>
          {query.loading && !stop && <p role="status">Đang kiểm tra trạng thái…</p>}
          {query.error ? (
            <p role="alert" className="mission-stop__warning">
              {safeStopError(query.error)}
            </p>
          ) : null}
          {ready && (
            <>
              {stop.canCancelMission === true && !requested ? (
                <p className="mission-stop__description">
                  Mission có thể được hủy. Lịch sử đã ghi nhận sẽ được giữ lại.
                </p>
              ) : (
                <>
                  <SafeStopSummary stop={stop} actor="manager" />
                  {!requested && (
                    <p className="mission-stop__guidance">
                      Đội bay chịu trách nhiệm đưa Mission về trạng thái an toàn
                      trước khi tiếp tục hủy.
                    </p>
                  )}
                </>
              )}
              {intent === 'replace' && (
                <p className="mission-stop__guidance">
                  Sau khi hủy, bạn có thể tạo Mission thay thế.
                </p>
              )}
              {requested ? (
                <dl className="mission-stop__reason">
                  <dt>Lý do dừng / hủy Mission</dt>
                  <dd>{stop.reason || reason || 'Chưa có thông tin lý do.'}</dd>
                </dl>
              ) : (
                (nextAction === 'request' || nextAction === 'cancel') && (
                  <div className="mission-stop__form">
                    <label className="mission-stop__field">
                      Lý do dừng / hủy Mission
                      <textarea
                        maxLength={1000}
                        value={reason}
                        disabled={busy}
                        onChange={(e) => setReason(e.target.value)}
                      />
                    </label>
                  </div>
                )
              )}
              {requested && nextAction === 'cancel' && !actionReason && (
                <p className="mission-stop__warning">
                  Chưa tải được lý do dừng. Làm mới trạng thái trước khi hủy
                  Mission.
                </p>
              )}
              {stop.cleanedAt && stop.canCancelMission !== true && (
                <p className="mission-stop__guidance">
                  {draft
                    ? 'Chỉ có thể hủy Mission khi kế hoạch đã được chốt (Finalized).'
                    : 'Chưa thể hủy Mission lúc này. Làm mới trạng thái để kiểm tra lại.'}
                </p>
              )}
              {stop.confirmedAt && !stop.cleanedAt && nextAction === null && (
                <p className="mission-stop__guidance">
                  Chưa đủ điều kiện giải phóng tài nguyên. Kiểm tra với đội bay
                  và làm mới trạng thái.
                </p>
              )}
              {nextAction && (
                <div className="mission-stop__actions">
                  <button
                    className={`odm-btn ${nextAction === 'cancel' ? 'odm-btn-rd' : 'odm-btn-p'}`}
                    disabled={
                      !allowed || (nextAction !== 'cleanup' && !actionReason)
                    }
                    onClick={() => void command(nextAction)}
                  >
                    {busy
                      ? 'Đang xử lý…'
                      : {
                          request: 'Yêu cầu dừng an toàn',
                          cleanup: 'Giải phóng tài nguyên',
                          cancel: 'Hủy Mission',
                        }[nextAction]}
                  </button>
                </div>
              )}
            </>
          )}
          {message && <p role="status">{message}</p>}
        </section>
      )}
    </>
  )
}
