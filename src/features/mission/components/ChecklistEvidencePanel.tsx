import { useState } from 'react'
import { checklistEvidenceApi } from '../api/checklistEvidenceApi'
import type {
  EvidenceBlockingReason,
  EvidenceCandidate,
  MissionChecklistExecution,
} from '../types/checklistExecution'
import './ChecklistEvidencePanel.css'

export const evidenceReason: Record<EvidenceBlockingReason, string> = {
  EVIDENCE_SOURCE_NOT_ELIGIBLE:
    'Nguồn media không hợp lệ. Chỉ bằng chứng camera drone được tính.',
  EVIDENCE_TYPE_NOT_ELIGIBLE: 'Loại media không được hỗ trợ.',
  MEDIA_REJECTED: 'Media đã bị từ chối.',
  MEDIA_NOT_VALIDATED: 'Media chưa xác thực thành công.',
  MEDIA_APPROVAL_REQUIRED: 'Duyệt media bắt buộc trước khi duyệt kết quả.',
  INSUFFICIENT_EVIDENCE: 'Chưa đủ bằng chứng hợp lệ.',
  EXECUTION_NOT_TERMINAL: 'Mục checklist chưa kết thúc.',
  UNABLE_REASON_REQUIRED: 'Cần lý do không thể xác minh.',
  CHECKLIST_INTEGRITY_INVALID: 'Checklist không khớp snapshot đơn hàng.',
}
const sourceLabel: Record<string, string> = {
  DRONE_CAMERA: 'Camera drone',
  SATELLITE_SNAPSHOT: 'Ảnh vệ tinh',
  MANUAL_UPLOAD: 'Upload thủ công',
}
const mediaStatusLabel: Record<string, string> = {
  PENDING_MANAGER_APPROVAL: 'Chờ manager duyệt',
  AVAILABLE: 'Đã duyệt',
  VALIDATING: 'Đang xác thực',
  UPLOADING: 'Đang upload',
  REJECTED: 'Bị từ chối',
}

export function ChecklistEvidencePanel({
  missionId,
  item,
  canAttach,
  canDetach,
  refresh,
  reviewMedia,
}: {
  missionId: string
  item: MissionChecklistExecution
  canAttach: boolean
  canDetach: boolean
  refresh: () => void
  reviewMedia?: (mediaId: string, reject: boolean) => Promise<unknown>
}) {
  const [candidates, setCandidates] = useState<EvidenceCandidate[] | null>(null)
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  async function act(operation: () => Promise<unknown>) {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await operation()
      refresh()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Không thể cập nhật bằng chứng.',
      )
      refresh()
    } finally {
      setBusy(false)
    }
  }
  async function load(nextPage: number) {
    setBusy(true)
    setError(null)
    try {
      setCandidates(await checklistEvidenceApi.candidates(missionId, nextPage))
      setPage(nextPage)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được media.')
    } finally {
      setBusy(false)
    }
  }
  return (
    <section
      className="checklist-evidence"
      aria-label={`Bằng chứng: ${item.content}`}
    >
      <strong>
        Bằng chứng hợp lệ: {item.eligibleEvidenceCount ?? 0} /{' '}
        {item.executionStatus === 'UNABLE_TO_VERIFY'
          ? 0
          : (item.minimumEvidenceCount ?? 0)}
      </strong>
      {item.blockingReasons?.map((reason) => (
        <p key={reason}>{evidenceReason[reason]}</p>
      ))}
      <div className="checklist-evidence-grid">
        {item.evidence?.map((link) => (
          <article key={link.evidenceId}>
            {link.previewUrl &&
              (link.mediaType === 'VIDEO' ? (
                <video src={link.previewUrl} controls preload="metadata" />
              ) : (
                <a href={link.previewUrl} target="_blank" rel="noreferrer">
                  <img
                    src={link.previewUrl}
                    alt={link.fileName}
                    loading="lazy"
                  />
                </a>
              ))}
            <div className="checklist-evidence-name">{link.fileName}</div>
            <small>
              {link.sourceType ?? 'Unknown/Legacy'} ·{' '}
              {link.mediaStatus ?? 'Legacy'}
            </small>
            <small>{new Date(link.capturedAt).toLocaleString('vi-VN')}</small>
            <p>
              {link.eligibleForOperationalReadiness
                ? 'Đủ điều kiện vận hành'
                : link.ineligibilityReason
                  ? evidenceReason[link.ineligibilityReason]
                  : 'Chưa hợp lệ'}
            </p>
            {!link.eligibleForFinalApproval &&
              link.mediaStatus === 'PENDING_MANAGER_APPROVAL' && (
                <p>{evidenceReason.MEDIA_APPROVAL_REQUIRED}</p>
              )}
            {canDetach && (
              <button
                type="button"
                className="odm-btn"
                disabled={busy}
                onClick={() =>
                  void act(() =>
                    checklistEvidenceApi.detach(
                      missionId,
                      item.id,
                      link.evidenceId,
                      item.version,
                    ),
                  )
                }
              >
                Gỡ bằng chứng
              </button>
            )}
            {reviewMedia && link.mediaStatus === 'PENDING_MANAGER_APPROVAL' && (
              <div>
                <button
                  type="button"
                  className="odm-btn"
                  disabled={busy}
                  onClick={() =>
                    void act(() => reviewMedia(link.mediaId, false))
                  }
                >
                  Duyệt media
                </button>
                <button
                  type="button"
                  className="odm-btn"
                  disabled={busy}
                  onClick={() =>
                    void act(() => reviewMedia(link.mediaId, true))
                  }
                >
                  Từ chối media
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
      {canAttach && (
        <button
          type="button"
          className="odm-btn"
          disabled={busy}
          onClick={() => void load(0)}
        >
          Thêm bằng chứng từ media Mission
        </button>
      )}
      {canAttach && candidates && (
        <div className="checklist-candidates">
          <ul className="checklist-candidate-list">
            {candidates.map((media) => (
              <li key={media.mediaId} className="checklist-candidate">
                <div className="checklist-candidate-info">
                  <span className="checklist-candidate-name" title={media.fileName}>
                    {media.fileName}
                  </span>
                  <span className="checklist-candidate-meta">
                    <span>
                      {sourceLabel[media.sourceType ?? ''] ??
                        media.sourceType ??
                        'Unknown/Legacy'}
                    </span>
                    <span className="checklist-candidate-status">
                      {mediaStatusLabel[media.status ?? ''] ??
                        media.status ??
                        'Legacy'}
                    </span>
                  </span>
                  {!media.attachable && (
                    <small>
                      {media.ineligibilityReason
                        ? evidenceReason[media.ineligibilityReason]
                        : 'Không thể gắn'}
                    </small>
                  )}
                </div>
                <button
                  type="button"
                  className="odm-btn"
                  disabled={
                    busy ||
                    !media.attachable ||
                    media.alreadyAttachedExecutionIds.includes(item.id)
                  }
                  onClick={() =>
                    void act(async () => {
                      await checklistEvidenceApi.attach(
                        missionId,
                        item.id,
                        media.mediaId,
                        item.version,
                      )
                      setCandidates(null)
                    })
                  }
                >
                  Gắn media
                </button>
              </li>
            ))}
          </ul>
          <div className="checklist-candidate-pager">
            <button
              type="button"
              className="odm-btn"
              disabled={busy || page === 0}
              onClick={() => void load(page - 1)}
            >
              Trang trước
            </button>
            <button
              type="button"
              className="odm-btn"
              disabled={busy || candidates.length < 50}
              onClick={() => void load(page + 1)}
            >
              Trang sau
            </button>
            <button
              type="button"
              className="odm-btn"
              onClick={() => setCandidates(null)}
            >
              Đóng chọn media
            </button>
          </div>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
