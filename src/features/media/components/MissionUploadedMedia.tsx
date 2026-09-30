import { useEffect, useRef, useState } from 'react'
import {
  operatorMissionMediaApi,
  type UploadedMissionMedia,
  type UploadedMissionMediaPage,
} from '../api/operatorMissionMediaApi'

import type { MissionMediaReader } from '../types/missionMedia'

export function MissionUploadedMedia({
  missionId,
  reader = operatorMissionMediaApi,
}: {
  missionId: string
  reader?: MissionMediaReader
}) {
  return <Gallery key={missionId} missionId={missionId} reader={reader} />
}

function Gallery({
  missionId,
  reader,
}: {
  missionId: string
  reader: MissionMediaReader
}) {
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
        if (!abort.signal.aborted)
          setError(
            cause instanceof Error ? cause.message : 'Không tải được media.',
          )
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
      className="odm-card"
      style={{ marginTop: 16 }}
      aria-label="Media đã upload của mission"
    >
      <div className="odm-card-body" style={{ padding: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <h3>Ảnh / video đã upload {data ? `(${data.totalItems})` : ''}</h3>
          <button
            type="button"
            className="odm-btn"
            disabled={loading}
            onClick={() => setRevision((value) => value + 1)}
          >
            Làm mới
          </button>
        </div>
        <p>Chỉ hiển thị file đã được backend xác thực và lưu thành công.</p>
        {error ? (
          <p role="alert">
            {error}{' '}
            <button
              type="button"
              className="odm-btn"
              onClick={() => setRevision((value) => value + 1)}
            >
              Thử lại
            </button>
          </p>
        ) : null}
        {loading ? <p role="status">Đang tải media...</p> : null}
        {opening ? <p role="status">Đang mở media...</p> : null}
        {!loading && !error && data?.items.length === 0 ? (
          <p>Mission chưa có ảnh/video upload thành công.</p>
        ) : null}
        {!loading && data ? (
          <>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              {data.items.map((item) => (
                <article
                  key={item.mediaId}
                  style={{
                    border: '1px solid var(--bd)',
                    borderRadius: 8,
                    padding: 12,
                    minWidth: 0,
                  }}
                >
                  {item.mediaType === 'IMAGE' ? (
                    <img
                      src={item.downloadUrl}
                      alt={item.fileName}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: 180,
                        objectFit: 'contain',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        height: 180,
                        display: 'grid',
                        placeItems: 'center',
                        background: 'var(--sf2)',
                      }}
                    >
                      VIDEO
                    </div>
                  )}
                  <p style={{ overflowWrap: 'anywhere' }}>{item.fileName}</p>
                  <p>
                    {item.deviceId} ·{' '}
                    {(item.fileSize / 1024 / 1024).toFixed(2)} MB
                  </p>
                  <p>
                    {item.capturedAt
                      ? new Date(item.capturedAt).toLocaleString('vi-VN')
                      : 'Chưa có thời điểm chụp'}
                  </p>
                  <button
                    type="button"
                    className="odm-btn"
                    disabled={opening}
                    onClick={() => void open(item)}
                  >
                    Xem {item.mediaType === 'IMAGE' ? 'ảnh' : 'video'}
                  </button>
                </article>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                marginTop: 12,
              }}
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
                Trang {data.totalPages ? data.page + 1 : 0} / {data.totalPages}
              </span>
              <button
                type="button"
                className="odm-btn"
                disabled={data.last}
                onClick={() => setPage((value) => value + 1)}
              >
                Trang sau
              </button>
            </div>
          </>
        ) : null}
        <dialog
          ref={dialog}
          onCancel={close}
          onClose={() => setSelected(null)}
          aria-label="Xem media"
          style={{ maxWidth: '90vw', width: 960, borderRadius: 8 }}
        >
          {selected ? (
            <>
              <button type="button" className="odm-btn" onClick={close}>
                Đóng
              </button>
              <p style={{ overflowWrap: 'anywhere' }}>{selected.fileName}</p>
              {error ? <p role="alert">{error}</p> : null}
              {selected.mediaType === 'IMAGE' ? (
                <img
                  src={selected.downloadUrl}
                  alt={selected.fileName}
                  style={{
                    width: '100%',
                    maxHeight: '70vh',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <video
                  key={selected.downloadUrl}
                  src={selected.downloadUrl}
                  controls
                  preload="metadata"
                  style={{ width: '100%', maxHeight: '70vh' }}
                />
              )}
              <p>Nếu liên kết hết hạn, bấm tải lại để lấy liên kết mới.</p>
              <button
                type="button"
                className="odm-btn"
                disabled={opening}
                onClick={() => void open(selected)}
              >
                Tải lại liên kết
              </button>
            </>
          ) : null}
        </dialog>
      </div>
    </section>
  )
}
