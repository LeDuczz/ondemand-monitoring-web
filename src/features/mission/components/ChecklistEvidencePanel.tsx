import { useState } from 'react'
import { createPortal } from 'react-dom'
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
  compact = false,
}: {
  missionId: string
  item: MissionChecklistExecution
  canAttach: boolean
  canDetach: boolean
  refresh: () => void
  reviewMedia?: (mediaId: string, reject: boolean) => Promise<unknown>
  /** Flat list layout for narrow side panels: no nested cards, one status per row. */
  compact?: boolean
}) {
  const [candidates, setCandidates] = useState<EvidenceCandidate[] | null>(null)
  const [page, setPage] = useState(0)
  const [query, setQuery] = useState('')
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
  const needle = query.trim().toLowerCase()
  const shown = (candidates ?? []).filter(
    (media) => !needle || media.fileName.toLowerCase().includes(needle),
  )
  const required =
    item.executionStatus === 'UNABLE_TO_VERIFY'
      ? 0
      : (item.minimumEvidenceCount ?? 0)
  const have = item.eligibleEvidenceCount ?? 0
  const links = item.evidence ?? []
  const needsApproval = links.some(
    (link) =>
      !link.eligibleForFinalApproval &&
      link.mediaStatus === 'PENDING_MANAGER_APPROVAL',
  )
  const compactBody = (
    <>
      <div className="ce-head">
        <span>Bằng chứng</span>
        <span className="ce-count">
          {have} / {required}
        </span>
      </div>
      {links.length > 0 && (
        <ul className="ce-list">
          {links.map((link) => {
            const pending = link.mediaStatus === 'PENDING_MANAGER_APPROVAL'
            const status =
              !link.eligibleForOperationalReadiness && link.ineligibilityReason
                ? evidenceReason[link.ineligibilityReason]
                : (mediaStatusLabel[link.mediaStatus ?? ''] ??
                  link.mediaStatus ??
                  'Legacy')
            const hasMenu = canDetach || (reviewMedia && pending)
            return (
              <li key={link.evidenceId} className="ce-row">
                <div className="ce-thumb">
                  {link.previewUrl &&
                    (link.mediaType === 'VIDEO' ? (
                      <video src={link.previewUrl} preload="metadata" />
                    ) : (
                      <img
                        src={link.previewUrl}
                        alt={link.fileName}
                        loading="lazy"
                      />
                    ))}
                </div>
                <div className="ce-info">
                  <span className="ce-name" title={link.fileName}>
                    {link.fileName}
                  </span>
                  <span className="ce-meta">
                    {link.mediaType === 'VIDEO' ? 'Video' : 'Ảnh'} •{' '}
                    {sourceLabel[link.sourceType ?? ''] ??
                      link.sourceType ??
                      'Unknown/Legacy'}
                  </span>
                  <span
                    className={`ce-status${link.eligibleForOperationalReadiness ? '' : ' is-warn'}`}
                  >
                    {status}
                  </span>
                </div>
                <div className="ce-actions">
                  {link.previewUrl && (
                    <a
                      className="ce-view"
                      href={link.previewUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Xem
                    </a>
                  )}
                  {hasMenu && (
                    <details className="ce-more">
                      <summary aria-label="Thêm thao tác">⋮</summary>
                      <div className="ce-menu">
                        {canDetach && (
                          <button
                            type="button"
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
                        {reviewMedia && pending && (
                          <>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void act(() => reviewMedia(link.mediaId, false))
                              }
                            >
                              Duyệt media
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() =>
                                void act(() => reviewMedia(link.mediaId, true))
                              }
                            >
                              Từ chối media
                            </button>
                          </>
                        )}
                      </div>
                    </details>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {required > 0 && have >= required && (
        <p className="ce-ok">✓ Đã đủ bằng chứng</p>
      )}
      {needsApproval && (
        <p className="ce-hint">
          ⓘ Media phải được duyệt trước khi hoàn tất mục.
        </p>
      )}
      {canAttach && (
        <button
          type="button"
          className="ce-add"
          title="Chọn media của mission làm bằng chứng"
          disabled={busy}
          onClick={() => void load(0)}
        >
          + Thêm media
        </button>
      )}
    </>
  )
  return (
    <section
      className={`checklist-evidence${compact ? ' is-compact' : ''}`}
      aria-label={`Bằng chứng: ${item.content}`}
    >
      {compact ? compactBody : (
      <>
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
            <div className="checklist-evidence-thumb">
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
            </div>
            <div className="checklist-evidence-main">
              <div className="checklist-evidence-name" title={link.fileName}>
                {link.fileName}
              </div>
              <div className="checklist-candidate-meta">
                <span>
                  {sourceLabel[link.sourceType ?? ''] ??
                    link.sourceType ??
                    'Unknown/Legacy'}
                </span>
                <span className="checklist-candidate-status">
                  {mediaStatusLabel[link.mediaStatus ?? ''] ??
                    link.mediaStatus ??
                    'Legacy'}
                </span>
              </div>
              <small>{new Date(link.capturedAt).toLocaleString('vi-VN')}</small>
              <p
                className={`checklist-evidence-note${link.eligibleForOperationalReadiness ? ' is-ok' : ''}`}
              >
                {link.eligibleForOperationalReadiness
                  ? 'Đủ điều kiện vận hành'
                  : link.ineligibilityReason
                    ? evidenceReason[link.ineligibilityReason]
                    : 'Chưa hợp lệ'}
              </p>
              {!link.eligibleForFinalApproval &&
                link.mediaStatus === 'PENDING_MANAGER_APPROVAL' && (
                  <p className="checklist-evidence-note">
                    {evidenceReason.MEDIA_APPROVAL_REQUIRED}
                  </p>
                )}
              <div className="checklist-evidence-actions">
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
                {reviewMedia &&
                  link.mediaStatus === 'PENDING_MANAGER_APPROVAL' && (
                    <>
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
                    </>
                  )}
              </div>
            </div>
          </article>
        ))}
      </div>
      {canAttach && (
        <button
          type="button"
          className="odm-btn checklist-evidence-add"
          disabled={busy}
          onClick={() => void load(0)}
        >
          Thêm bằng chứng từ media Mission
        </button>
      )}
      </>
      )}
      {canAttach &&
        candidates &&
        createPortal(
          <div
            className="checklist-picker"
            role="dialog"
            aria-modal="true"
            aria-label="Chọn media làm bằng chứng"
          >
            <div
              className="checklist-picker-backdrop"
              onClick={() => setCandidates(null)}
            />
            <div className="checklist-picker-panel">
              <header className="checklist-picker-head">
                <div>
                  <strong>Chọn media làm bằng chứng</strong>
                  <span>
                    {item.content} · Trang {page + 1}
                  </span>
                </div>
                <button
                  type="button"
                  className="checklist-picker-close"
                  aria-label="Đóng"
                  onClick={() => setCandidates(null)}
                >
                  ×
                </button>
              </header>
              <input
                type="search"
                className="checklist-picker-search"
                aria-label="Tìm media"
                placeholder="Tìm theo tên file…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <div className="checklist-picker-body">
                {shown.length === 0 && (
                  <p className="checklist-candidates-empty">
                    Không có media nào để gắn.
                  </p>
                )}
                <ul className="checklist-candidate-list">
                  {shown.map((media) => (
                    <li key={media.mediaId} className="checklist-candidate">
                      <div className="checklist-candidate-thumb">
                        {media.previewUrl && media.mediaType !== 'VIDEO' ? (
                          <img src={media.previewUrl} alt="" loading="lazy" />
                        ) : (
                          <span aria-hidden="true">
                            {media.mediaType === 'VIDEO' ? '▶' : '▣'}
                          </span>
                        )}
                      </div>
                      <div className="checklist-candidate-info">
                        <span
                          className="checklist-candidate-name"
                          title={media.fileName}
                        >
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
                        <small className="checklist-candidate-time">
                          {new Date(media.capturedAt).toLocaleString('vi-VN')}
                        </small>
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
                        className="odm-btn odm-btn-p"
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
              </div>
              <footer className="checklist-candidate-pager">
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
              </footer>
            </div>
          </div>,
          document.body,
        )}
      {error && <p role="alert">{error}</p>}
    </section>
  )
}
