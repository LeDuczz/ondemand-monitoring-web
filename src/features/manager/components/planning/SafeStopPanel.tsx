import { useEffect, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { planningApi } from '../../api/planningApi'
import { planningError } from '../../lib/planningErrors'
import type { SafeStop } from '../../types/planning'

export function SafeStopPanel({
  missionId,
  revision,
  manager = false,
  onChanged,
  onCapabilitiesChanged,
}: {
  missionId: string
  revision?: number
  manager?: boolean
  onChanged: () => void
  onCapabilitiesChanged?: (missionId: string, canCancel: boolean) => void
}) {
  const query = useApiQuery(
    (signal) => planningApi.getSafeStop(missionId, signal),
    [missionId, revision],
  )
  const [reason, setReason] = useState('')
  const [attested, setAttested] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  useEffect(() => {
    onCapabilitiesChanged?.(
      missionId,
      !query.loading && !query.error && query.data?.canCancelMission === true,
    )
  }, [missionId, query.loading, query.error, query.data, onCapabilitiesChanged])
  async function command(action: 'request' | 'confirm' | 'cleanup') {
    const field: Record<typeof action, keyof SafeStop> = {
      request: 'canRequestSafeStop',
      confirm: 'canConfirmSafeStop',
      cleanup: 'canCleanupSafeStop',
    }
    if (
      busy ||
      query.loading ||
      query.error ||
      query.data?.[field[action]] !== true
    )
      return
    setBusy(true)
    setMessage('')
    try {
      if (action === 'request' && revision !== undefined)
        await planningApi.requestSafeStop(missionId, {
          expectedPlanRevision: revision,
          reason: reason.trim(),
        })
      else if (action === 'confirm')
        await planningApi.confirmSafeStop(missionId, reason.trim())
      else if (action === 'cleanup')
        await planningApi.cleanupSafeStop(missionId)
      query.reload()
      onChanged()
      setMessage('Đã ghi nhận. Dữ liệu đang được tải lại từ máy chủ.')
    } catch (error) {
      setMessage(planningError(error))
      query.reload()
      onChanged()
    } finally {
      setBusy(false)
    }
  }
  const stop = query.data
  return (
    <section
      className="odm-planning-stop"
      aria-label={`Safe-stop ${missionId}`}
    >
      <div className="odm-planning-heading">
        <h4>Safe-stop / cleanup</h4>
        <button
          type="button"
          className="odm-btn"
          disabled={busy || query.loading}
          onClick={query.reload}
        >
          Làm mới safe-stop
        </button>
      </div>
      {query.loading && <p role="status">Đang tải safe-stop…</p>}
      {query.error ? <p role="alert">{planningError(query.error)}</p> : null}
      {stop && !query.error && (
        <>
          <p>
            Trạng thái: <strong>{stop.status ?? 'Chưa yêu cầu'}</strong>
          </p>
          {stop.requestedAt && (
            <p>Yêu cầu lúc: {new Date(stop.requestedAt).toLocaleString()}</p>
          )}
          {stop.requestedBy && <p>Người yêu cầu: {stop.requestedBy}</p>}
          {stop.reason && <p>Lý do: {stop.reason}</p>}
          {stop.confirmedAt && (
            <p>
              Crew xác nhận lúc: {new Date(stop.confirmedAt).toLocaleString()}
            </p>
          )}
          {stop.confirmedBy && <p>Crew xác nhận: {stop.confirmedBy}</p>}
          {stop.confirmation && <p>Xác nhận vận hành: {stop.confirmation}</p>}
          {stop.cleanedAt && (
            <p>Cleanup hoàn tất: {new Date(stop.cleanedAt).toLocaleString()}</p>
          )}
          {stop.failureReason && <p role="alert">{stop.failureReason}</p>}
          <p>
            {stop.requiresLanding
              ? 'Cần PILOT được phân công xác nhận đã hạ cánh và disarm.'
              : 'Crew có quyền phải xác nhận an toàn nếu còn session.'}{' '}
            Backend không tự điều khiển drone hạ cánh.
          </p>
          {manager && stop.canRequestSafeStop === true && !stop.status && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void command('request')
              }}
            >
              <label>
                Lý do safe-stop {missionId}
                <textarea
                  maxLength={1000}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <button
                className="odm-btn odm-btn-p"
                disabled={busy || query.loading || !reason.trim()}
              >
                Yêu cầu safe-stop
              </button>
            </form>
          )}
          {!manager && stop.canConfirmSafeStop === true && (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void command('confirm')
              }}
            >
              <label>
                Xác nhận vận hành {missionId}
                <textarea
                  required
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  required
                  checked={attested}
                  onChange={(e) => setAttested(e.target.checked)}
                />{' '}
                Tôi xác nhận drone đã an toàn/disarm và control session đã đóng
                bên ngoài.
              </label>
              <button
                className="odm-btn odm-btn-p"
                disabled={busy || query.loading || !attested || !reason.trim()}
              >
                Xác nhận an toàn
              </button>
            </form>
          )}
          {manager && stop.canCleanupSafeStop === true && (
            <button
              type="button"
              className="odm-btn"
              disabled={busy || query.loading}
              onClick={() => {
                if (
                  window.confirm(
                    `Cleanup session và resource của Mission ${missionId}?`,
                  )
                )
                  void command('cleanup')
              }}
            >
              Cleanup Mission
            </button>
          )}
          {stop.status === 'READY_FOR_CANCELLATION' && (
            <p>
              Đã cleanup an toàn. Hủy Mission vẫn cần plan DRAFT, revision hợp
              lệ và backend chấp nhận.
            </p>
          )}
        </>
      )}
      {message && <p role="status">{message}</p>}
    </section>
  )
}
