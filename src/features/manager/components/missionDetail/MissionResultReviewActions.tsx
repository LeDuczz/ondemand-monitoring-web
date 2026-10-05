import { useState } from 'react'
import { missionsApi } from '../../api/missionsApi'
import { monitoringErrorMessage } from '../../../mission/components/MonitoringChecklistSection'
import type { MissionResultApprovalStatus } from '../../../mission/types/mission'

export function MissionResultReviewActions({
  resultId,
  status,
  ready,
  refreshing = false,
  onReviewed,
}: {
  resultId: string
  status: MissionResultApprovalStatus
  ready: boolean
  refreshing?: boolean
  onReviewed: () => void
}) {
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function review(reject: boolean) {
    if (
      busy ||
      refreshing ||
      status !== 'PENDING_MANAGER_APPROVAL' ||
      (!reject && !ready)
    )
      return
    setBusy(true)
    setError(null)
    try {
      if (reject) await missionsApi.rejectMissionResult(resultId, note)
      else await missionsApi.approveMissionResult(resultId)
      setNote('')
      onReviewed()
    } catch (cause) {
      setError(monitoringErrorMessage(cause))
      onReviewed()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="odm-or-result-actions">
      {status === 'DRAFT' && <p>Kết quả nháp — chưa được gửi để duyệt.</p>}
      {status === 'REJECTED' && (
        <p>Kết quả đã bị từ chối. Monitoring actor cần chỉnh sửa và gửi lại.</p>
      )}
      {status === 'APPROVED' && <p>Kết quả đã được duyệt.</p>}
      {error && <p role="alert">{error}</p>}
      {status === 'PENDING_MANAGER_APPROVAL' && (
        <>
          <label>
            Nhận xét từ chối (không bắt buộc)
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
            />
          </label>
          {!ready && (
            <p>Duyệt media bắt buộc trước, rồi kiểm tra checklist sẵn sàng để duyệt kết quả.</p>
          )}
          <button
            type="button"
            className="odm-or-btn odm-or-btn-blue"
            disabled={busy || refreshing || !ready}
            onClick={() => void review(false)}
          >
            Duyệt kết quả
          </button>
          <button
            type="button"
            className="odm-or-btn"
            disabled={busy || refreshing}
            onClick={() => void review(true)}
          >
            Từ chối kết quả
          </button>
        </>
      )}
      <p>
        Duyệt kết quả không tự động duyệt media. Duyệt từng media riêng trong
        thư viện bên dưới.
      </p>
    </div>
  )
}
