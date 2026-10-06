import { useState } from 'react'
import { ApiError } from '../../../shared/api/httpClient'
import { checklistExecutionApi } from '../api/checklistExecutionApi'
import type {
  ChecklistExecutionStatus,
  ChecklistAssessmentStatus,
  MissionChecklistExecution,
  MissionChecklistResponse,
} from '../types/checklistExecution'
import type { MissionResultApprovalStatus } from '../types/mission'
import './MonitoringChecklistSection.css'
import { ChecklistEvidencePanel, evidenceReason } from './ChecklistEvidencePanel'

const statuses: Record<ChecklistExecutionStatus, string> = {
  PENDING: 'Chưa thực hiện',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Đã thực hiện',
  UNABLE_TO_VERIFY: 'Không thể xác minh',
}
const assessments: Record<ChecklistAssessmentStatus, string> = {
  NOT_ASSESSED: 'Chưa đánh giá',
  COMPLIANT: 'Đạt yêu cầu',
  NON_COMPLIANT: 'Không đạt yêu cầu',
}
/** Time only for today, otherwise day/month + time. */
function formatUpdated(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
  return date.toDateString() === new Date().toDateString()
    ? time
    : `${date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} ${time}`
}
const terminal = (status: ChecklistExecutionStatus) =>
  status === 'COMPLETED' || status === 'UNABLE_TO_VERIFY'
export function allowedExecutionStatuses(
  status: ChecklistExecutionStatus,
  rejected: boolean,
): ChecklistExecutionStatus[] {
  const all: ChecklistExecutionStatus[] = [
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'UNABLE_TO_VERIFY',
  ]
  if (terminal(status)) return rejected ? all : [status]
  return all.filter(
    (next) =>
      next === status ||
      next === 'COMPLETED' ||
      next === 'UNABLE_TO_VERIFY' ||
      (status === 'PENDING' && next === 'IN_PROGRESS'),
  )
}

export function monitoringErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.code === 'CHECKLIST_EXECUTION_PARENT_MISMATCH')
      return 'Mục checklist không thuộc mission này. Vui lòng tải lại đúng mission.'
    if (error.code === 'CONCURRENT_UPDATE')
      return 'Dữ liệu đã thay đổi. Chỉnh sửa của bạn chưa được lưu. Tải dữ liệu mới và kiểm tra lại trước khi lưu.'
    if (error.status === 401)
      return 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.'
    if (error.status === 403)
      return 'Bạn không có quyền thực hiện thao tác này.'
    if (error.status === 404)
      return 'Không tìm thấy mission hoặc mục checklist. Vui lòng tải lại.'
    if (error.code === 'CHECKLIST_EXECUTION_LOCKED')
      return 'Checklist đã khóa để duyệt kết quả. Vui lòng tải lại trạng thái.'
    if (error.code === 'CHECKLIST_EXECUTION_TRANSITION_INVALID')
      return 'Chuyển trạng thái không hợp lệ. Vui lòng tải lại dữ liệu.'
    if (error.code === 'MISSION_STATUS_INVALID')
      return 'Trạng thái mission đã thay đổi. Vui lòng tải lại.'
    if (error.code === 'CHECKLIST_NOT_READY')
      return 'Checklist chưa sẵn sàng gửi kết quả. Vui lòng kiểm tra các mục còn lại.'
  }
  return error instanceof Error
    ? error.message
    : 'Không thể tải hoặc lưu checklist. Vui lòng thử lại.'
}

export function MonitoringChecklistSection({
  missionId,
  data,
  loading,
  error,
  canExecute = false,
  resultStatus,
  resultNote,
  resultKnown = true,
  refresh,
  canAttach = false,
  canDetach = false,
  reviewMedia,
  compact = false,
}: {
  missionId: string
  data?: MissionChecklistResponse
  loading: boolean
  error?: unknown
  canExecute?: boolean
  resultStatus?: MissionResultApprovalStatus | null
  resultNote?: string | null
  resultKnown?: boolean
  refresh: () => void
  canAttach?: boolean
  canDetach?: boolean
  reviewMedia?: (mediaId: string, reject: boolean) => Promise<unknown>
  /** Dense acceptance panel: one line per item, only the active item expands. */
  compact?: boolean
}) {
  const [openId, setOpenId] = useState<string | null>(null)
  const locked =
    resultStatus === 'PENDING_MANAGER_APPROVAL' || resultStatus === 'APPROVED'
  const editable = canExecute && resultKnown && !locked && !loading && !error
  const rows = [...(data?.executions ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
  )
  const done = rows.filter((row) => terminal(row.executionStatus)).length
  if (compact) {
    const firstTodo = rows.find((row) => !terminal(row.executionStatus))
    const activeId =
      openId === '' ? null : rows.some((row) => row.id === openId) ? openId : (firstTodo ?? rows[0])?.id
    const canChange = (data?.checklistEvidenceReady ?? data?.readyForSubmission) === true
    return (
      <section
        className="monitoring-checklist odm-card is-compact"
        aria-label="Monitoring Checklist"
      >
        <header>
          <h2>Checklist nghiệm thu</h2>
          <span className="mc-count">
            {done} / {rows.length}
          </span>
        </header>
        <div className="mc-progress" aria-hidden="true">
          <span style={{ width: rows.length ? `${(done / rows.length) * 100}%` : '0%' }} />
        </div>
        {loading && <p role="status" className="mc-note">Đang tải checklist…</p>}
        {error ? (
          <div role="alert" className="mc-note is-danger">
            <p>{monitoringErrorMessage(error)}</p>
            <button type="button" className="odm-btn" onClick={refresh}>
              Thử lại checklist
            </button>
          </div>
        ) : null}
        {!loading && !error && data ? (
          <>
            {resultStatus === 'REJECTED' && (
              <p className="mc-note is-warn">
                Kết quả bị từ chối
                {resultNote ? `: ${resultNote}` : ''}
              </p>
            )}
            {data.legacySnapshot && (
              <p className="mc-note">Mission cũ — không có snapshot checklist giám sát lịch sử.</p>
            )}
            {!rows.length && <p className="mc-note">Không có mục checklist giám sát.</p>}
            {!editable && rows.length > 0 && (
              <p className="mc-note">
                {locked
                  ? 'Chỉ đọc — kết quả đang chờ duyệt hoặc đã được duyệt.'
                  : 'Chỉ đọc — bạn không có quyền cập nhật hoặc trạng thái chưa được xác minh.'}
              </p>
            )}
            {!canChange && done === rows.length && rows.length > 0 && !data.readyForSubmission && (
              <p className="mc-note is-warn" role="alert">
                Dữ liệu checklist chưa đủ điều kiện theo backend. Hãy làm mới; nếu vẫn chưa sẵn sàng, liên hệ quản trị viên.
              </p>
            )}
          </>
        ) : null}
        {data && (
          <ol className="mc-list">
            {rows.map((item, index) => {
              const open = item.id === activeId
              const finished = terminal(item.executionStatus)
              const missing =
                finished &&
                item.executionStatus === 'COMPLETED' &&
                (item.eligibleEvidenceCount ?? 0) < (item.minimumEvidenceCount ?? 0)
              const tone =
                item.executionStatus === 'UNABLE_TO_VERIFY'
                  ? 'is-unable'
                  : finished
                    ? missing
                      ? 'is-missing'
                      : 'is-done'
                    : item.id === firstTodo?.id
                      ? 'is-current'
                      : ''
              return (
                <li key={`evidence:${missionId}:${item.id}`} className={`mc-item ${tone}${open ? ' is-open' : ''}`}>
                  <button
                    type="button"
                    className="mc-row"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? '' : item.id)}
                  >
                    <span className="mc-mark" aria-hidden="true">
                      {tone === 'is-done' ? '✓' : tone === 'is-unable' ? '!' : index + 1}
                    </span>
                    <span className="mc-text">
                      <span className="mc-title">{item.content}</span>
                      <span className="mc-sub">
                        {item.eligibleEvidenceCount ?? 0}/
                        {item.executionStatus === 'UNABLE_TO_VERIFY'
                          ? 0
                          : (item.minimumEvidenceCount ?? 0)}{' '}
                        bằng chứng
                      </span>
                    </span>
                    {tone === 'is-current' && <span className="mc-chip is-todo">Cần làm</span>}
                    {tone === 'is-missing' && <span className="mc-chip is-pending">Thiếu bằng chứng</span>}
                    {tone === 'is-unable' && <span className="mc-chip is-danger">Không xác minh</span>}
                    <span className="mc-caret" aria-hidden="true" />
                  </button>
                  {open && (
                    <div className="mc-detail">
                      <ChecklistExecutionItem
                        key={`${missionId}:${item.id}`}
                        item={item}
                        missionId={missionId}
                        editable={editable}
                        rejected={resultStatus === 'REJECTED'}
                        refresh={refresh}
                        compact
                      />
                      <ChecklistEvidencePanel
                        missionId={missionId}
                        item={item}
                        canAttach={canAttach && resultKnown && !locked && !loading && !error}
                        canDetach={canDetach && resultKnown && !locked && !loading && !error}
                        refresh={refresh}
                        reviewMedia={reviewMedia}
                        compact
                      />
                      {item.updatedAt && (
                        <small className="mc-updated">
                          Cập nhật {formatUpdated(item.updatedAt)}
                        </small>
                      )}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>
    )
  }
  return (
    <section
      className="monitoring-checklist odm-card"
      aria-label="Monitoring Checklist"
    >
      <header>
        <div>
          <h2>Checklist giám sát</h2>
          <p>
            Yêu cầu lịch sử của đơn hàng · tách biệt kiểm tra kỹ thuật thiết bị.
          </p>
        </div>
        <button
          type="button"
          className="odm-btn"
          onClick={refresh}
          disabled={loading}
        >
          Làm mới checklist
        </button>
      </header>
      {loading && (
        <p role="status">Đang tải checklist và trạng thái kết quả…</p>
      )}
      {error ? (
        <div role="alert">
          <p>{monitoringErrorMessage(error)}</p>
          <button type="button" className="odm-btn" onClick={refresh}>
            Thử lại checklist
          </button>
        </div>
      ) : null}
      {!loading && !error && data ? (
        <>
          <div
            className={`monitoring-summary${(data.checklistEvidenceReady ?? data.readyForSubmission) ? ' is-ready' : ''}`}
            role="status"
          >
            <strong>
              {(data.checklistEvidenceReady ?? data.readyForSubmission)
                ? 'Sẵn sàng gửi kết quả'
                : 'Chưa sẵn sàng gửi kết quả'}
            </strong>
            <span>
              {done} / {rows.length} mục ở trạng thái kết thúc ·{' '}
              {rows.length - done} mục chưa hoàn tất
            </span>
            <span
              className="monitoring-progress"
              aria-hidden="true"
              style={{
                ['--p' as string]: rows.length
                  ? `${(done / rows.length) * 100}%`
                  : '0%',
              }}
            />
          </div>
          <div className="monitoring-notes">
          {data.blockingReasons?.map(reason => <p key={reason} role="status" className="is-warn">{evidenceReason[reason]}</p>)}
          {resultStatus && (
            <p>
              Trạng thái kết quả:{' '}
              {
                {
                  DRAFT: 'Nháp — chưa gửi manager',
                  PENDING_MANAGER_APPROVAL: 'Chờ manager duyệt',
                  APPROVED: 'Đã duyệt',
                  REJECTED:
                    'Bị từ chối — có thể chỉnh sửa và gửi lại khi có quyền',
                }[resultStatus]
              }
            </p>
          )}
          {resultStatus === 'REJECTED' && resultNote && (
            <p>Nhận xét của manager: {resultNote}</p>
          )}
          {!data.readyForSubmission && done === rows.length && (
            <p role="alert" className="is-warn">
              Dữ liệu checklist chưa đủ điều kiện theo backend. Hãy làm mới; nếu
              vẫn chưa sẵn sàng, liên hệ quản trị viên.
            </p>
          )}
          {data.legacySnapshot && (
            <p>
              Mission cũ — không có snapshot checklist giám sát lịch sử. Không
              suy diễn yêu cầu từ dịch vụ hiện tại.
            </p>
          )}
          {!rows.length && <p>Không có mục checklist giám sát.</p>}
          <p className="monitoring-hint">
            {locked
              ? 'Chỉ đọc — kết quả đang chờ duyệt hoặc đã được duyệt.'
              : editable
                ? 'Bạn có thể cập nhật checklist.'
                : 'Chỉ đọc — bạn không có quyền cập nhật hoặc trạng thái chưa được xác minh.'}
          </p>
          </div>
        </>
      ) : null}
      {data && (
        <ol className="monitoring-list">
          {rows.map((item) => (
            <li key={`evidence:${missionId}:${item.id}`}>
            <ChecklistExecutionItem
              key={`${missionId}:${item.id}`}
              item={item}
              missionId={missionId}
              editable={editable}
              rejected={resultStatus === 'REJECTED'}
              refresh={refresh}
            />
            <ChecklistEvidencePanel missionId={missionId} item={item} canAttach={canAttach && resultKnown && !locked && !loading && !error} canDetach={canDetach && resultKnown && !locked && !loading && !error} refresh={refresh} reviewMedia={reviewMedia} />
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

function ChecklistExecutionItem({
  item,
  missionId,
  editable,
  rejected,
  refresh,
  compact = false,
}: {
  item: MissionChecklistExecution
  missionId: string
  editable: boolean
  rejected: boolean
  refresh: () => void
  compact?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [base, setBase] = useState(item)
  const [status, setStatus] = useState(item.executionStatus)
  const [assessment, setAssessment] = useState(item.assessmentStatus)
  const [observation, setObservation] = useState(item.observation ?? '')
  const [reason, setReason] = useState(item.unableToVerifyReason ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conflict, setConflict] = useState(false)
  function reset() {
    setBase(item)
    setStatus(item.executionStatus)
    setAssessment(item.assessmentStatus)
    setObservation(item.observation ?? '')
    setReason(item.unableToVerifyReason ?? '')
    setConflict(false)
    setError(null)
  }
  async function save() {
    if (!editable || busy || conflict) return
    if (status === 'UNABLE_TO_VERIFY' && !reason.trim()) {
      setError('Vui lòng nhập lý do không thể xác minh.')
      return
    }
    if (observation.length > 2000 || reason.length > 1000) {
      setError('Ghi nhận tối đa 2000 ký tự; lý do tối đa 1000 ký tự.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const updated =
        await checklistExecutionApi.updateMissionChecklistExecution(
          missionId,
          item.id,
          {
            expectedVersion: base.version,
            executionStatus: status,
            assessmentStatus: assessment,
            observation: observation.trim() || null,
            unableToVerifyReason:
              status === 'UNABLE_TO_VERIFY' ? reason.trim() : null,
          },
        )
      setBase(updated)
      setEditing(false)
      refresh()
    } catch (cause) {
      setError(monitoringErrorMessage(cause))
      if (cause instanceof ApiError && cause.code === 'CONCURRENT_UPDATE')
        setConflict(true)
      // Never retry a mutation automatically. Refresh authority/versions after any rejected save.
      refresh()
    } finally {
      setBusy(false)
    }
  }
  if (compact) {
    return (
      <div className="monitoring-item mc-item-body">
        {error && <p role="alert">{error}</p>}
        {!editing ? (
          <>
            <dl className="mc-fields">
              <div>
                <dt>Trạng thái</dt>
                <dd>{statuses[item.executionStatus]}</dd>
              </div>
              <div>
                <dt>Đánh giá</dt>
                <dd>{assessments[item.assessmentStatus]}</dd>
              </div>
              <div className="is-wide">
                <dt>Ghi chú</dt>
                <dd className={item.observation ? undefined : 'is-empty'}>
                  {item.observation || 'Chưa có ghi chú'}
                </dd>
              </div>
              {item.unableToVerifyReason && (
                <div className="is-wide">
                  <dt>Lý do không thể xác minh</dt>
                  <dd>{item.unableToVerifyReason}</dd>
                </div>
              )}
            </dl>
            {editable && (
              <button
                type="button"
                className="mc-edit"
                onClick={() => {
                  reset()
                  setEditing(true)
                }}
              >
                Chỉnh sửa
              </button>
            )}
          </>
        ) : (
          <form
            className="mc-form"
            onSubmit={(event) => {
              event.preventDefault()
              void save()
            }}
          >
            <fieldset disabled={!editable || busy}>
              <label>
                Trạng thái
                <select
                  value={status}
                  onChange={(event) => {
                    setStatus(event.target.value as ChecklistExecutionStatus)
                    if (event.target.value !== 'UNABLE_TO_VERIFY') setReason('')
                  }}
                >
                  {allowedExecutionStatuses(base.executionStatus, rejected).map(
                    (value) => (
                      <option key={value} value={value}>
                        {statuses[value]}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Đánh giá
                <select
                  value={assessment}
                  onChange={(event) =>
                    setAssessment(
                      event.target.value as ChecklistAssessmentStatus,
                    )
                  }
                >
                  {(
                    Object.keys(assessments) as ChecklistAssessmentStatus[]
                  ).map((value) => (
                    <option key={value} value={value}>
                      {assessments[value]}
                    </option>
                  ))}
                </select>
              </label>
              <p className="mc-help">
                ⓘ Đánh giá không đạt không tự động làm mission thất bại.
              </p>
              <label>
                Ghi chú
                <textarea
                  maxLength={2000}
                  placeholder="Thêm ghi chú nếu cần..."
                  value={observation}
                  onChange={(event) => setObservation(event.target.value)}
                />
              </label>
              <small className="mc-counter">{observation.length} / 2000</small>
              {status === 'UNABLE_TO_VERIFY' && (
                <label>
                  Lý do không thể xác minh
                  <textarea
                    aria-label="Lý do không thể xác minh"
                    maxLength={1000}
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                  />
                  <small className="mc-counter">{reason.length} / 1000</small>
                </label>
              )}
              {conflict && (
                <button type="button" className="odm-btn" onClick={reset}>
                  Dùng dữ liệu mới (bỏ chỉnh sửa chưa lưu)
                </button>
              )}
              <div className="mc-form-actions">
                <button
                  type="button"
                  className="mc-cancel"
                  onClick={() => setEditing(false)}
                >
                  Hủy
                </button>
                <button
                  className="odm-btn odm-btn-p"
                  type="submit"
                  disabled={conflict || busy}
                >
                  Lưu
                </button>
              </div>
            </fieldset>
          </form>
        )}
      </div>
    )
  }
  return (
    <div className="monitoring-item">
      {!compact && <h3>{item.content}</h3>}
      {(!compact || item.assessmentStatus !== 'NOT_ASSESSED') && (
      <div className="monitoring-meta">
        {!compact && (
          <span className={`is-exec-${item.executionStatus.toLowerCase()}`}>
            {statuses[item.executionStatus]}
          </span>
        )}
        <span className={`is-assess-${item.assessmentStatus.toLowerCase()}`}>
          {assessments[item.assessmentStatus]}
        </span>
        {!compact && (
          <span className={terminal(item.executionStatus) ? 'is-done' : 'is-todo'}>
            {terminal(item.executionStatus) ? 'Đã kết thúc' : 'Cần thực hiện'}
          </span>
        )}
      </div>
      )}
      {item.observation && (
        <p>
          <strong>Ghi nhận:</strong> {item.observation}
        </p>
      )}
      {item.unableToVerifyReason && (
        <p>
          <strong>Lý do không thể xác minh:</strong> {item.unableToVerifyReason}
        </p>
      )}
      {!compact && item.updatedAt && (
        <small>
          Cập nhật: {new Date(item.updatedAt).toLocaleString('vi-VN')}
        </small>
      )}
      {error && <p role="alert">{error}</p>}
      {editable && !editing && (
        <button
          type="button"
          className={compact ? 'mc-link' : 'odm-btn'}
          onClick={() => {
            reset()
            setEditing(true)
          }}
        >
          Cập nhật mục
        </button>
      )}
      {editing && (
        <form
          onSubmit={(event) => {
            event.preventDefault()
            void save()
          }}
        >
          <fieldset disabled={!editable || busy}>
            <label>
              Trạng thái thực hiện
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as ChecklistExecutionStatus)
                  if (event.target.value !== 'UNABLE_TO_VERIFY') setReason('')
                }}
              >
                {allowedExecutionStatuses(base.executionStatus, rejected).map(
                  (value) => (
                    <option key={value} value={value}>
                      {statuses[value]}
                    </option>
                  ),
                )}
              </select>
            </label>
            <label>
              Đánh giá
              <select
                value={assessment}
                onChange={(event) =>
                  setAssessment(event.target.value as ChecklistAssessmentStatus)
                }
              >
                {(Object.keys(assessments) as ChecklistAssessmentStatus[]).map(
                  (value) => (
                    <option key={value} value={value}>
                      {assessments[value]}
                    </option>
                  ),
                )}
              </select>
            </label>
            <small>
              Không đạt yêu cầu không đồng nghĩa mission thất bại. Chưa đánh giá
              là lựa chọn hợp lệ.
            </small>
            <label>
              Ghi nhận
              <textarea
                maxLength={2000}
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
              />
            </label>
            <small>{observation.length} / 2000</small>
            {status === 'UNABLE_TO_VERIFY' && (
              <label>
                Lý do không thể xác minh
                <textarea
                  aria-label="Lý do không thể xác minh"
                  maxLength={1000}
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                />
                <small>{reason.length} / 1000</small>
              </label>
            )}
            {conflict && (
              <button type="button" className="odm-btn" onClick={reset}>
                Dùng dữ liệu mới (bỏ chỉnh sửa chưa lưu)
              </button>
            )}
            <div className="monitoring-actions">
              <button
                className="odm-btn odm-btn-p"
                type="submit"
                disabled={conflict || busy}
              >
                Lưu mục
              </button>
              <button
                className="odm-btn"
                type="button"
                onClick={() => setEditing(false)}
              >
                Hủy chỉnh sửa
              </button>
            </div>
          </fieldset>
        </form>
      )}
    </div>
  )
}
