import { ApiError } from '../../../shared/api/httpClient'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import type { useMissionMonitoring } from '../../mission/hooks/useMissionMonitoring'
import './MissionResultActions.css'

type Monitoring = ReturnType<typeof useMissionMonitoring>

/** Backend capabilities identify the actor; readiness and lifecycle identify the operation. */
export function missionResultActions(
  missionId: string,
  status: string | undefined,
  query: Monitoring,
) {
  const data = query.data
  const known =
    !query.loading &&
    !query.error &&
    data?.checklist.missionId === missionId &&
    (!data.result || data.result.missionId === missionId)
  const submitted =
    known &&
    (data.result?.approvalStatus === 'PENDING_MANAGER_APPROVAL' ||
      data.result?.approvalStatus === 'APPROVED')
  const canComplete =
    known &&
    status === 'PENDING_REVIEW' &&
    data.permissions.canCompleteMission === true
  const canSubmit =
    known && data.permissions.canSubmitMissionResult === true && !submitted
  const completeReady =
    canComplete && data.checklist.readyForMissionCompletion === true
  const submitReady =
    canSubmit &&
    status === 'COMPLETED' &&
    data.checklist.readyForSubmission === true
  const remaining =
    data?.checklist.executions.filter(
      (row) => !['COMPLETED', 'UNABLE_TO_VERIFY'].includes(row.executionStatus),
    ).length ?? 0
  const readinessReason = !known
    ? 'Đang xác nhận checklist và quyền thao tác.'
    : remaining > 0
      ? `Còn ${remaining} mục checklist chưa hoàn tất.`
      : data.checklist.executions.some(
            (row) =>
              row.executionStatus === 'UNABLE_TO_VERIFY' &&
              !row.unableToVerifyReason?.trim(),
          )
        ? 'Cần bổ sung lý do cho mục không thể xác minh.'
        : data.checklist.blockingReasons?.includes(
              'CHECKLIST_INTEGRITY_INVALID',
            )
          ? 'Checklist chưa được xác nhận. Vui lòng làm mới và kiểm tra lại.'
          : data.checklist.blockingReasons?.includes('MEDIA_REJECTED')
            ? 'Có media bằng chứng bị từ chối. Cần bổ sung bằng chứng hợp lệ.'
            : data.checklist.blockingReasons?.includes('MEDIA_NOT_VALIDATED')
              ? 'Media bằng chứng chưa xác thực thành công.'
              : 'Checklist chưa sẵn sàng hoặc chưa đủ bằng chứng hợp lệ. Kiểm tra các mục và media đã gắn.'
  return {
    known,
    submitted,
    canComplete,
    canSubmit,
    completeReady,
    submitReady,
    readinessReason,
  }
}

/** Keep the original error object in state for diagnostics; never present server internals. */
export function staffResultError(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 401)
      return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
    if (error.status === 403)
      return 'Bạn không có quyền thực hiện thao tác này.'
    if (error.code === 'MISSION_STATUS_INVALID')
      return 'Trạng thái Mission đã thay đổi. Dữ liệu mới đang được cập nhật.'
    if (error.code === 'CHECKLIST_EXECUTION_LOCKED')
      return 'Kết quả đã được gửi hoặc duyệt. Dữ liệu mới đang được cập nhật.'
    if (error.code === 'CHECKLIST_NOT_READY')
      return 'Checklist chưa hoàn tất hoặc chưa đủ bằng chứng hợp lệ.'
  }
  return 'Không thể thực hiện thao tác. Dữ liệu mới đang được cập nhật; vui lòng kiểm tra và thử lại.'
}

export function MissionResultActions({
  missionId,
  status,
  monitoring,
  busy,
  onComplete,
  onSubmit,
}: {
  missionId: string
  status?: string
  monitoring: Monitoring
  busy: boolean
  onComplete: () => void
  onSubmit: () => void
}) {
  const state = missionResultActions(missionId, status, monitoring)
  if (!['PENDING_REVIEW', 'COMPLETED'].includes(status ?? '')) return null
  const reasonId = `result-readiness-${missionId}`
  const submitReason =
    status !== 'COMPLETED'
      ? 'Cần nghiệm thu Mission trước khi gửi kết quả.'
      : state.readinessReason
  return (
    <section
      className="staff-result-actions"
      aria-label="Nghiệm thu và gửi kết quả"
    >
      <div className="staff-result-phase" role="status">
        {status === 'COMPLETED'
          ? 'Mission đã được nghiệm thu.'
          : 'Mission đang chờ nghiệm thu.'}
        {state.submitted && (
          <>
            <span>
              {monitoring.data?.result?.approvalStatus === 'APPROVED'
                ? 'Kết quả đã được Manager duyệt.'
                : 'Kết quả đã được gửi Manager và đang chờ duyệt.'}
            </span>
            <StatusBadge tone="green">
              {monitoring.data?.result?.approvalStatus === 'APPROVED'
                ? 'Đã duyệt'
                : 'Chờ duyệt'}
            </StatusBadge>
          </>
        )}
      </div>
      {(state.canComplete || state.canSubmit) && (
        <div className="staff-result-buttons">
          {state.canComplete && (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={busy || !state.completeReady}
              aria-describedby={!state.completeReady ? reasonId : undefined}
              onClick={onComplete}
            >
              Nghiệm thu Mission
            </button>
          )}
          {state.canSubmit && (
            <button
              type="button"
              className={`odm-btn${status === 'COMPLETED' ? ' odm-btn-p' : ''}`}
              disabled={busy || !state.submitReady}
              aria-describedby={!state.submitReady ? reasonId : undefined}
              onClick={onSubmit}
            >
              Gửi kết quả cho Manager
            </button>
          )}
        </div>
      )}
      {((state.canSubmit && !state.submitReady) ||
        (state.canComplete && !state.completeReady)) && (
        <p id={reasonId} className="staff-result-reason">
          {state.canComplete && !state.completeReady
            ? state.readinessReason
            : submitReason}
        </p>
      )}
      {busy && <p role="status">Đang xử lý…</p>}
      {!state.known && (
        <p role="status">Đang xác nhận checklist và quyền thao tác.</p>
      )}
    </section>
  )
}
