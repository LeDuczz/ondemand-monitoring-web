import { useState } from 'react'
import type { OperatorMission, MediaFile, MediaFileStatus } from '../types'
import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import mediaData from '../../../../mocks/data/operator-media.json'

interface Props {
  mission: OperatorMission
  onDone: () => void
  onManual?: () => void
}

const STATUS_LABEL: Record<MediaFileStatus, string> = {
  DONE: 'Đã upload',
  UPLOADING: 'Đang upload',
  FAILED: 'Thất bại',
  PENDING: 'Chờ upload',
  QUEUED: 'Trong hàng',
}

const STATUS_TONE: Record<MediaFileStatus, 'green' | 'blue' | 'red' | 'gray' | 'yellow'> = {
  DONE: 'green',
  UPLOADING: 'blue',
  FAILED: 'red',
  PENDING: 'gray',
  QUEUED: 'yellow',
}

export default function MediaUpload({ mission, onDone }: Props) {
  const [files, setFiles] = useState<MediaFile[]>(() => mediaData.files as MediaFile[])
  const [offline] = useState(false)

  const done = files.filter((f) => f.status === 'DONE').length
  const uploading = files.filter((f) => f.status === 'UPLOADING').length
  const failed = files.filter((f) => f.status === 'FAILED').length
  const total = files.length
  const allProcessed = done + failed === total

  const maxRetriesFailed = files.filter((f) => f.status === 'FAILED' && f.attempts >= f.maxAttempts)

  function handleRetry(fileId: string) {
    setFiles((prev) =>
      prev.map((f) =>
        f.id === fileId && f.attempts < f.maxAttempts
          ? { ...f, status: 'UPLOADING', attempts: f.attempts + 1, progressPct: 0 }
          : f,
      ),
    )
    // Simulate upload
    setTimeout(() => {
      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId && f.status === 'UPLOADING'
            ? { ...f, status: 'DONE', progressPct: 100 }
            : f,
        ),
      )
    }, 2000)
  }

  function fmtSize(mb: number) {
    return mb >= 100 ? `${mb.toFixed(0)} MB` : `${mb.toFixed(1)} MB`
  }

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
      <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 4 }}>
        Upload media · <span style={{ fontFamily: 'var(--font-data)' }}>{mission.id}</span>
      </div>
      <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--tx)', margin: '0 0 4px' }}>Upload media</h1>
      <div style={{ fontSize: 13, color: 'var(--tx2)', marginBottom: 18 }}>{mission.droneId} {mission.droneName}</div>

      {/* Offline banner */}
      {offline && (
        <div style={{ background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#92400e', display: 'flex', justifyContent: 'space-between' }}>
          <span>Mất kết nối mạng từ 14:41 · tự động tiếp tục khi có mạng</span>
          <span style={{ fontWeight: 600 }}>Đang ngoại tuyến.</span>
        </div>
      )}

      {/* Max retries warning */}
      {maxRetriesFailed.length > 0 && (
        <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 8, padding: '10px 14px', marginBottom: 12, fontSize: 13, color: '#9a3412' }}>
          {maxRetriesFailed.length} tệp thất bại {maxRetriesFailed[0]!.maxAttempts} lần: {maxRetriesFailed.map((f) => f.name).join(', ')}.
          Đã tạo yêu cầu xử lý thủ công. Bạn vẫn có thể sang Postflight.
        </div>
      )}

      {/* Summary strip */}
      <div style={{
        background: 'var(--sf)',
        border: '1px solid var(--bd)',
        borderRadius: 10,
        padding: '14px 18px',
        marginBottom: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div style={{ fontSize: 13, color: 'var(--tx)' }}>
          <strong>{done}/{total}</strong> file đã lên
          {uploading > 0 && <span style={{ marginLeft: 10 }}>· <strong>{uploading}</strong> đang lên</span>}
          {failed > 0 && <span style={{ marginLeft: 10 }}>· <strong>{failed}</strong> cần xử lý thủ công</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {uploading > 0 && (
            <span style={{ fontSize: 12, color: 'var(--tx3)' }}>Tốc độ 3,2 MB/s · còn khoảng 6 phút</span>
          )}
        </div>
      </div>

      {/* File table */}
      <div style={{ background: 'var(--sf)', border: '1px solid var(--bd)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 1fr 60px 100px 80px', gap: 0, padding: '10px 16px', background: 'var(--sf2)', borderBottom: '1px solid var(--bd)' }}>
          {['Tên tệp', 'Loại', 'Dung lượng', 'Tiến trình', 'Lần thử', 'Trạng thái', ''].map((h) => (
            <div key={h} style={{ fontSize: 11, fontWeight: 600, color: 'var(--tx3)' }}>{h}</div>
          ))}
        </div>

        {files.map((f, i) => (
          <div
            key={f.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '2fr 80px 80px 1fr 60px 100px 80px',
              gap: 0,
              padding: '10px 16px',
              alignItems: 'center',
              borderBottom: i < files.length - 1 ? '1px solid var(--bd)' : 'none',
            }}
          >
            <span style={{ fontSize: 12, fontFamily: 'var(--font-data)', color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
            <span>
              <StatusBadge tone={f.type === 'PHOTO' ? 'blue' : 'orange'}>{f.type === 'PHOTO' ? 'PHOTO' : 'VIDEO'}</StatusBadge>
            </span>
            <span style={{ fontSize: 12, color: 'var(--tx2)' }}>{fmtSize(f.sizeMB)}</span>
            <div style={{ paddingRight: 12 }}>
              {f.status === 'UPLOADING' || f.status === 'DONE' ? (
                <div style={{ height: 6, background: 'var(--sf3)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${f.progressPct}%`, background: f.status === 'DONE' ? 'var(--green-solid)' : 'var(--blue-solid)', borderRadius: 3, transition: 'width .3s' }} />
                </div>
              ) : (
                <span style={{ fontSize: 11, color: 'var(--tx3)' }}>—</span>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--tx2)' }}>{f.attempts}/{f.maxAttempts}</span>
            <span><StatusBadge tone={STATUS_TONE[f.status]}>{STATUS_LABEL[f.status]}</StatusBadge></span>
            <span>
              {f.status === 'FAILED' && f.attempts < f.maxAttempts && (
                <button
                  className="odm-btn odm-btn-gh"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={() => handleRetry(f.id)}
                >
                  Thử lại
                </button>
              )}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      {allProcessed && (
        <button className="odm-btn odm-btn-p" onClick={onDone}>
          Tiếp tục sang Postflight →
        </button>
      )}
    </div>
  )
}
