import { useState } from 'react'

import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { operatorApi } from '../api/operatorApi'
import { uploadSummary } from '../lib/uploadSummary'
import { operatorHref } from '../routes'
import { FlightStepHeader } from './FlightStepper'
import { MediaTable } from './MediaTable'

const MISSION_ID = 'MSN-2609-0142-1'

/** OPR-08W — Upload media: header thống kê + bảng file + retry thủ công. */
export function UploadMediaScreen() {
  const mediaQuery = useApiQuery(
    (signal) => operatorApi.getMedia(MISSION_ID, signal),
    [],
  )
  const [retryingId, setRetryingId] = useState<string | null>(null)

  const files = mediaQuery.data?.files ?? []
  const summary = uploadSummary(files)
  const failedFinal = files.filter(
    (f) => f.status === 'FAILED' && f.manualTaskCreated,
  )

  async function handleRetry(fileId: string) {
    setRetryingId(fileId)
    try {
      await operatorApi.retryUpload(MISSION_ID, fileId)
      mediaQuery.reload()
    } finally {
      setRetryingId(null)
    }
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title="Upload media"
        missionId={MISSION_ID}
        active={6}
        right={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 32,
              padding: '0 12px',
              borderRadius: 16,
              background: 'var(--sf3)',
              fontWeight: 700,
              fontSize: 13,
              flex: 'none',
            }}
          >
            DRN-02 Hải Âu
          </span>
        }
      />
      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div
            style={{
              display: 'flex',
              gap: 18,
              alignItems: 'center',
              padding: '12px 18px',
              borderRadius: 14,
              background: 'var(--sf)',
              border: '1.5px solid var(--bd)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {summary.nUploaded}/{summary.nTotal} file đã lên
                {summary.nUploading > 0 ? ` · ${summary.nUploading} đang lên` : ''}
                {summary.nManual > 0
                  ? ` · ${summary.nManual} cần xử lý thủ công`
                  : ''}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--tx3)', marginTop: 2 }}>
                Tốc độ 3,2 MB/s · media_upload_attempt tối đa 3 lần mỗi tệp
              </div>
            </div>
            {summary.isDone ? (
              <a
                className="odm-btn odm-btn-ok"
                href={operatorHref({ screen: 'postflight' })}
                style={{ minWidth: 200 }}
              >
                Tiếp tục: Postflight
              </a>
            ) : (
              <button type="button" className="odm-btn odm-btn-p" style={{ minWidth: 160 }}>
                Upload tất cả
              </button>
            )}
          </div>

          {failedFinal.length > 0 ? (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 12,
                background: 'var(--yellow-bg)',
                color: 'var(--yellow-fg)',
                border: '1.5px solid var(--yellow-dot)',
                fontSize: 13,
              }}
            >
              {failedFinal.length} tệp thất bại 3 lần:{' '}
              <b>{failedFinal.map((f) => f.name).join(', ')}</b>. Đã tạo yêu cầu xử
              lý thủ công (manual_upload_task). Bạn vẫn có thể sang Postflight.
            </div>
          ) : null}

          <MediaTable
            files={files}
            retryingId={retryingId}
            onRetry={handleRetry}
          />
        </div>
      </div>
    </div>
  )
}
