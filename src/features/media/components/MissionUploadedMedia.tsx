import { useEffect, useRef, useState } from 'react'
import { Icon } from '../../../shared/components/Icon'
import {
  operatorMissionMediaApi,
  type UploadedMissionMedia,
  type UploadedMissionMediaPage,
} from '../api/operatorMissionMediaApi'

import type {
  MissionMediaReader,
  MissionMediaReviewStatus,
} from '../types/missionMedia'
import './MissionUploadedMedia.css'

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const isReference = (item: UploadedMissionMedia) =>
  item.sourceType === 'MAPILLARY_REFERENCE'

const formatCapturedAt = (value: string | null) => {
  if (!value) return 'Chưa có thời điểm chụp'
  const capturedAt = new Date(value)
  if (Number.isNaN(capturedAt.getTime())) return 'Không rõ thời điểm chụp'
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(capturedAt)
}

export function MissionUploadedMedia({
  missionId,
  reader = operatorMissionMediaApi,
  reviewStatus,
  approveMedia,
}: {
  missionId: string
  reader?: MissionMediaReader
  reviewStatus?: MissionMediaReviewStatus | null
  approveMedia?: (mediaId: string) => Promise<unknown>
}) {
  return (
    <Gallery
      key={missionId}
      missionId={missionId}
      reader={reader}
      reviewStatus={reviewStatus ?? null}
      approveMedia={approveMedia}
    />
  )
}

function Gallery({
  missionId,
  reader,
  reviewStatus,
  approveMedia,
}: {
  missionId: string
  reader: MissionMediaReader
  reviewStatus: MissionMediaReviewStatus | null
  approveMedia?: (mediaId: string) => Promise<unknown>
}) {
  const [approving, setApproving] = useState<string | null>(null)
  const [approved, setApproved] = useState<string[]>([])
  async function approve(mediaId: string) {
    if (!approveMedia || approving) return
    setApproving(mediaId); setError(null)
    try {
      await approveMedia(mediaId)
      setApproved((ids) => [...ids, mediaId])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không thể duyệt media.')
    } finally { setApproving(null) }
  }
  const [page, setPage] = useState(0)
  const [revision, setRevision] = useState(0)
  const [data, setData] = useState<UploadedMissionMediaPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<UploadedMissionMedia | null>(null)
  const [opening, setOpening] = useState(false)
  const previewRequest = useRef<AbortController | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    setError(null)
    void reader
      .list(missionId, page, abort.signal)
      .then((result) => {
        if (!abort.signal.aborted) setData(result)
      })
      .catch((cause: unknown) => {
        if (abort.signal.aborted) return
        const message = cause instanceof Error ? cause.message : ''
        if (/result not found/i.test(message)) {
          setData({ items: [], page: 0, size: 0, totalItems: 0, totalPages: 0 } as unknown as typeof data)
          return
        }
        setError(message || 'Không tải được media.')
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false)
      })
    return () => abort.abort()
  }, [missionId, page, revision, reader])

  useEffect(() => () => previewRequest.current?.abort(), [])
  useEffect(() => {
    if (selected) dialog.current?.showModal()
  }, [selected])

  async function open(item: UploadedMissionMedia) {
    previewRequest.current?.abort()
    const abort = new AbortController()
    previewRequest.current = abort
    setOpening(true)
    setError(null)
    try {
      const fresh = await reader.get(missionId, item.mediaId, abort.signal)
      if (!abort.signal.aborted) setSelected(fresh)
    } catch (cause) {
      if (!abort.signal.aborted)
        setError(
          cause instanceof Error ? cause.message : 'Không mở được media.',
        )
    } finally {
      if (!abort.signal.aborted) setOpening(false)
    }
  }

  function close() {
    previewRequest.current?.abort()
    setOpening(false)
    dialog.current?.close()
    setSelected(null)
  }

  return (
    <section
      className="odm-card mission-media"
      aria-label="Media đã upload của mission"
    >
      <div className="odm-card-body mission-media__body">
        <header className="mission-media__header">
          <div>
            <span className="mission-media__eyebrow">Kết quả nhiệm vụ</span>
            <div className="mission-media__title-row">
              <h3>Thư viện ảnh &amp; video</h3>
              {data ? (
                <span className="mission-media__count">{data.totalItems}</span>
              ) : null}
              {reviewStatus ? <ReviewStatusBadge status={reviewStatus} /> : null}
            </div>
            <p>
              Ảnh/video operator đã gửi cho manager nghiệm thu. Manager có thể mở
              từng media để kiểm tra trước khi duyệt.
            </p>
          </div>
          <button
            type="button"
            className="odm-btn mission-media__refresh"
            disabled={loading}
            onClick={() => setRevision((value) => value + 1)}
          >
            <Icon name="activity" width={16} height={16} aria-hidden="true" />
            Làm mới
          </button>
        </header>
        {error ? (
          <div
            className="mission-media__state mission-media__state--error"
            role="alert"
          >
            <span>{error}</span>
            <button
              type="button"
              className="odm-btn"
              onClick={() => setRevision((value) => value + 1)}
            >
              Thử lại
            </button>
          </div>
        ) : null}
        {loading ? (
          <div className="mission-media__state" role="status">
            <span className="mission-media__spinner" aria-hidden="true" />
            Đang tải media...
          </div>
        ) : null}
        {opening ? (
          <p className="mission-media__opening" role="status">
            Đang chuẩn bị bản xem trước...
          </p>
        ) : null}
        {!loading && !error && data?.items.length === 0 ? (
          <div className="mission-media__empty">
            <span className="mission-media__empty-icon">
              <Icon name="camera" width={28} height={28} aria-hidden="true" />
            </span>
            <strong>Chưa có media</strong>
            <span>Mission chưa có ảnh/video upload thành công.</span>
          </div>
        ) : null}
        {!loading && data ? (
          <>
            <div className="mission-media__grid">
              {data.items.map((item) => (
                <article key={item.mediaId} className="mission-media__card">
                  <button
                    type="button"
                    className="mission-media__preview"
                    disabled={opening}
                    aria-label={`Xem ${item.fileName}`}
                    onClick={() => void open(item)}
                  >
                    {item.mediaType === 'IMAGE' ? (
                      <img src={item.downloadUrl} alt="" loading="lazy" />
                    ) : (
                      <span className="mission-media__video-placeholder">
                        <span
                          className="mission-media__play"
                          aria-hidden="true"
                        />
                        <span>VIDEO</span>
                      </span>
                    )}
                    <span className="mission-media__type">
                      {isReference(item)
                        ? 'Ảnh tham chiếu thực tế · Mapillary'
                        : item.sourceType === 'SATELLITE_SNAPSHOT' ? 'Ảnh vệ tinh · Browser snapshot'
                        : item.sourceType === 'DRONE_CAMERA' ? 'Camera drone'
                        : item.sourceType === 'MANUAL_UPLOAD' ? 'Media tải lên thủ công'
                        : item.mediaType === 'IMAGE' ? 'Ảnh' : 'Video'}
                    </span>
                    <span className="mission-media__open-label">Xem media</span>
                  </button>
                  <div className="mission-media__card-body">
                    <h4 title={item.fileName}>{item.fileName}</h4>
                    {approveMedia && (!item.status || item.status === 'PENDING_MANAGER_APPROVAL') ? <button type="button" className="odm-btn" disabled={approving !== null || approved.includes(item.mediaId)} onClick={() => void approve(item.mediaId)}>{approved.includes(item.mediaId) ? 'Đã duyệt media trong phiên này' : approving === item.mediaId ? 'Đang duyệt media…' : 'Duyệt media cho khách hàng'}</button> : null}
                    {item.status === 'AVAILABLE' || approved.includes(item.mediaId) ? <span className="mission-media__review-badge mission-media__review-badge--approved is-compact">Media đã duyệt</span> : null}
                    {reviewStatus ? (
                      <ReviewStatusBadge status={reviewStatus} compact />
                    ) : null}
                    <div className="mission-media__meta">
                      <span title={item.deviceId}>
                        <Icon
                          name="cpu"
                          width={14}
                          height={14}
                          aria-hidden="true"
                        />
                        {item.deviceId}
                      </span>
                      <span>{formatFileSize(item.fileSize)}</span>
                    </div>
                    {isReference(item) ? (
                      <p className="mission-media__reference">
                        {item.sourceDistanceMeters != null
                          ? `Ảnh tham chiếu cách vị trí drone ${Math.round(item.sourceDistanceMeters)} m`
                          : 'Ảnh tham chiếu thực tế'}
                        {item.captureLatitude != null && item.captureLongitude != null
                          ? ` · Drone: ${item.captureLatitude.toFixed(5)}, ${item.captureLongitude.toFixed(5)}`
                          : ''}
                      </p>
                    ) : null}
                    <time dateTime={item.capturedAt ?? undefined}>
                      <Icon
                        name="clock"
                        width={14}
                        height={14}
                        aria-hidden="true"
                      />
                      {formatCapturedAt(item.capturedAt)}
                    </time>
                  </div>
                </article>
              ))}
            </div>
            {data.totalPages > 1 ? (
              <nav
                className="mission-media__pager"
                aria-label="Phân trang media"
              >
                <button
                  type="button"
                  className="odm-btn"
                  disabled={data.first}
                  onClick={() => setPage((value) => value - 1)}
                >
                  Trang trước
                </button>
                <span>
                  Trang {data.totalPages ? data.page + 1 : 0} /{' '}
                  {data.totalPages}
                </span>
                <button
                  type="button"
                  className="odm-btn"
                  disabled={data.last}
                  onClick={() => setPage((value) => value + 1)}
                >
                  Trang sau
                </button>
              </nav>
            ) : null}
          </>
        ) : null}
        <dialog
          ref={dialog}
          onCancel={close}
          onClose={() => setSelected(null)}
          aria-label="Xem media"
          className="mission-media__dialog"
        >
          {selected ? (
            <>
              <header className="mission-media__dialog-header">
                <div>
                  <span>
                    {selected.mediaType === 'IMAGE' ? 'Ảnh' : 'Video'}
                  </span>
                  <h3>{selected.fileName}</h3>
                </div>
                <button
                  type="button"
                  className="odm-btn"
                  onClick={close}
                  aria-label="Đóng"
                >
                  <Icon name="x" width={18} height={18} aria-hidden="true" />
                </button>
              </header>
              {error ? <p role="alert">{error}</p> : null}
              <div className="mission-media__dialog-stage">
                {selected.mediaType === 'IMAGE' ? (
                  <img src={selected.downloadUrl} alt={selected.fileName} />
                ) : (
                  <video
                    key={selected.downloadUrl}
                    src={selected.downloadUrl}
                    controls
                    preload="metadata"
                  />
                )}
              </div>
              <footer className="mission-media__dialog-footer">
                <span>Nếu liên kết hết hạn, hãy lấy liên kết mới.</span>
                <button
                  type="button"
                  className="odm-btn"
                  disabled={opening}
                  onClick={() => void open(selected)}
                >
                  Tải lại liên kết
                </button>
              </footer>
            </>
          ) : null}
        </dialog>
      </div>
    </section>
  )
}

function reviewStatusText(status: MissionMediaReviewStatus) {
  if (status === 'DRAFT') return 'Kết quả nháp — chưa gửi manager'
  if (status === 'APPROVED') return 'Đã nghiệm thu'
  if (status === 'REJECTED') return 'Bị từ chối'
  return 'Chờ manager nghiệm thu'
}

function ReviewStatusBadge({
  status,
  compact = false,
}: {
  status: MissionMediaReviewStatus
  compact?: boolean
}) {
  const tone =
    status === 'APPROVED'
      ? 'approved'
      : status === 'REJECTED'
        ? 'rejected'
        : 'pending'
  return (
    <span
      className={`mission-media__review-badge mission-media__review-badge--${tone}${compact ? ' is-compact' : ''}`}
    >
      {reviewStatusText(status)}
    </span>
  )
}
