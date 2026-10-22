import { useId, useState } from 'react'
import { missionsApi } from '../../api/missionsApi'
import type { MissionResultApprovalStatus } from '../../../mission/types/mission'
import { OrderIcon } from './OrderIcon'
import { missionResultReviewErrorMessage } from './missionResultReviewReadiness'
import './MissionResultReviewCard.css'
import { Button, useConfirm, useToast } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { managerFeedbackMessages } from '../../feedback.messages'

export function MissionResultReviewActions({
  resultId,
  status,
  ready,
  refreshing = false,
  disabledReasonId,
  onReviewed,
}: {
  resultId: string
  status: MissionResultApprovalStatus
  ready: boolean
  refreshing?: boolean
  disabledReasonId?: string
  onReviewed: () => void
}) {
  const { t: fb } = useI18n(managerFeedbackMessages)
  const toast = useToast()
  const confirm = useConfirm()
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const noteId = useId()
  async function review(reject: boolean) {
    if (
      busy ||
      refreshing ||
      status !== 'PENDING_MANAGER_APPROVAL' ||
      (!reject && !ready)
    )
      return
    if (
      reject &&
      !(await confirm({
        title: fb.rejectResultTitle,
        description: fb.rejectResultBody,
        confirmLabel: fb.rejectResultAction,
        tone: 'danger',
      }))
    )
      return
    setBusy(true)
    setError(null)
    try {
      if (reject) await missionsApi.rejectMissionResult(resultId, note)
      else await missionsApi.approveMissionResult(resultId, note)
      setNote('')
      toast.success(reject ? fb.resultRejected : fb.resultApproved)
      onReviewed()
    } catch (cause) {
      setError(cause)
      toast.error(missionResultReviewErrorMessage(cause))
      onReviewed()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="odm-result-review-actions" aria-busy={busy}>
      {status === 'DRAFT' && <p>Kết quả nháp — chưa được gửi để duyệt.</p>}
      {status === 'REJECTED' && (
        <p>
          Kết quả đã bị từ chối. Nhân sự thực hiện cần chỉnh sửa và gửi lại.
        </p>
      )}
      {status === 'APPROVED' && <p>Kết quả đã được duyệt.</p>}
      {error != null && (
        <p className="odm-result-review-error" role="alert">
          {missionResultReviewErrorMessage(error)}
        </p>
      )}
      {status === 'PENDING_MANAGER_APPROVAL' && (
        <>
          <div className="odm-result-review-note">
            <div className="odm-result-review-note-label">
              <label htmlFor={noteId}>Ghi chú / lý do</label>
              <span>
                Cần khi từ chối, hoặc khi duyệt dù thiếu ảnh/video so với đơn
              </span>
            </div>
            <textarea
              id={noteId}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
              rows={3}
              placeholder="Nhập lý do (ít nhất 10 ký tự) nếu từ chối hoặc duyệt khi còn thiếu media…"
            />
          </div>
          {!ready && !disabledReasonId && (
            <p>Checklist chưa sẵn sàng để duyệt kết quả.</p>
          )}
          <div className="odm-result-review-buttons">
            <Button
              type="button"
              variant="danger"
              className="odm-result-review-reject"
              disabled={busy || refreshing}
              onClick={() => void review(true)}
            >
              <OrderIcon name="x" size={16} />
              Từ chối kết quả
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={busy || refreshing || !ready}
              aria-describedby={!ready ? disabledReasonId : undefined}
              onClick={() => void review(false)}
            >
              <OrderIcon name="check" size={16} />
              Duyệt kết quả
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
