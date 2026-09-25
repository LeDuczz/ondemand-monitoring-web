import { useCallback, useEffect, useState } from 'react'

import { operatorMediaApi, type LocalMedia } from '../../media/api/operatorMediaApi'
import { missionApi } from '../../mission/api/missionApi'
import { getActiveMissionId, markActiveMissionFlowStep, setActiveMissionId } from '../api/liveMission'
import { flightControlApi } from '../omss/api/flightControlApi'
import { operatorHref } from '../routes'
import type { MediaFile } from '../types/mission'
import { FlightStepHeader } from './FlightStepper'
import { MediaTable } from './MediaTable'

const postflightTelemetryKey = (missionId: string) =>
  `fieldwise.operator.postflightTelemetry.${missionId}`

/** Existing upload layout backed by the selected mission's local media. */
export function UploadMediaScreen({ missionId: routeMissionId }: { missionId?: string }) {
  const [fallbackMissionId] = useState(() => getActiveMissionId())
  const missionId = routeMissionId ?? fallbackMissionId
  const [items, setItems] = useState<LocalMedia[]>([])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [postflightBusy, setPostflightBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!missionId) return
    setActiveMissionId(missionId)
    markActiveMissionFlowStep(missionId, 5)
  }, [missionId])

  const refresh = useCallback(async () => {
    if (!missionId) { setLoading(false); return }
    try {
      const media = await operatorMediaApi.list(missionId)
      setItems(media)
      const ids = media.flatMap((item) => item.backendMediaId ? [item.backendMediaId] : [])
      const results = await Promise.allSettled(ids.map((id) => operatorMediaApi.status(id)))
      setStatuses((previous) => {
        const next = { ...previous }
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') next[ids[index]] = result.value.status
        })
        return next
      })
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không tải được media trên Flight Controller')
    } finally {
      setLoading(false)
    }
  }, [missionId])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function approve(item: LocalMedia) {
    setBusyId(item.localMediaId)
    try {
      await operatorMediaApi.upload(item)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload thất bại')
    } finally {
      setBusyId(null)
    }
  }

  async function discard(item: LocalMedia) {
    if (!window.confirm(`Xóa bản local ${item.fileName} trên Flight Controller?`)) return
    setBusyId(item.localMediaId)
    try {
      await operatorMediaApi.discard(item.localMediaId)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không xóa được media')
    } finally {
      setBusyId(null)
    }
  }

  async function continueToPostflight() {
    if (!missionId || postflightBusy) return
    setPostflightBusy(true)
    setError(null)
    try {
      const telemetrySnapshot = await flightControlApi.status().catch(() => null)
      if (telemetrySnapshot) {
        window.sessionStorage.setItem(postflightTelemetryKey(missionId), JSON.stringify(telemetrySnapshot))
      }

      let mission = await missionApi.getMissionById(missionId)
      if (mission.status === 'IN_FLIGHT' || mission.status === 'IN_PROGRESS') {
        mission = await missionApi.markReturning(missionId)
      }
      if (mission.status === 'RETURNING') {
        mission = await missionApi.startPostflight(missionId)
      }
      if (mission.status !== 'POSTFLIGHT_CHECKING') {
        throw new Error(`Mission chưa sẵn sàng Postcheck (${mission.status}).`)
      }

      markActiveMissionFlowStep(missionId, 6)
      window.location.hash = operatorHref({ screen: 'postflight', missionId })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không chuyển được mission sang Postcheck')
    } finally {
      setPostflightBusy(false)
    }
  }

  const effectiveStatus = (item: LocalMedia) => (item.backendMediaId && statuses[item.backendMediaId]) || item.status
  const approvable = items.filter((item) => ['REVIEW_PENDING', 'UPLOAD_FAILED', 'RETRY_REQUIRED', 'MANUAL_UPLOAD_REQUIRED'].includes(effectiveStatus(item)))
  const files: MediaFile[] = items.map((item) => {
    const status = effectiveStatus(item)
    return {
      id: item.localMediaId, name: item.fileName,
      type: item.mediaType === 'IMAGE' ? 'PHOTO' : 'VIDEO', sizeBytes: item.fileSize,
      progressPct: status === 'AVAILABLE' ? 100 : status === 'VALIDATING' ? 90 : status === 'UPLOADING' ? 50 : 0,
      attempt: 0, maxAttempts: 3,
      status: status === 'AVAILABLE' ? 'UPLOADED' : status === 'UPLOADING' || status === 'VALIDATING' ? 'UPLOADING' : status === 'UPLOAD_FAILED' || status === 'RETRY_REQUIRED' || status === 'MANUAL_UPLOAD_REQUIRED' ? 'FAILED' : 'PENDING_UPLOAD',
      manualTaskCreated: status === 'MANUAL_UPLOAD_REQUIRED',
    }
  })
  const uploaded = files.filter((item) => item.status === 'UPLOADED').length
  const uploading = files.filter((item) => item.status === 'UPLOADING').length
  const manual = files.filter((item) => item.manualTaskCreated).length

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader title="Upload media" missionId={missionId ?? 'Đang mở mission'} active={6}
        right={<span style={{ padding: '6px 12px', borderRadius: 16, background: 'var(--sf3)', fontWeight: 700, fontSize: 13 }}>{items[0]?.droneCode ?? '—'}</span>} />
      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '12px 18px', borderRadius: 14, background: 'var(--sf)', border: '1.5px solid var(--bd)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{uploaded}/{files.length} file đã lên{uploading ? ` · ${uploading} đang lên` : ''}{manual ? ` · ${manual} cần xử lý thủ công` : ''}</div>
              <div style={{ fontSize: 12.5, color: 'var(--tx3)', marginTop: 2 }}>Ảnh/video vẫn ở Flight Controller cho đến khi duyệt hoặc xóa bản local.</div>
            </div>
            <a className="odm-btn" href={operatorHref({ screen: 'flight', missionId: missionId ?? undefined })}>Quay lại buồng lái</a>
            <button type="button" className="odm-btn odm-btn-ok" disabled={!missionId || postflightBusy} onClick={() => void continueToPostflight()}>
              {postflightBusy ? 'Đang chuyển...' : 'Complete mission'}
            </button>
            <button type="button" className="odm-btn" onClick={() => void refresh()}>Làm mới</button>
            <button type="button" className="odm-btn odm-btn-p" disabled={!missionId || !!busyId || approvable.length === 0}
                  onClick={() => { void (async () => { for (const item of approvable) await approve(item) })() }}>Upload tất cả</button>
          </div>
          {!missionId && !loading && <p role="alert">Đang khôi phục mission đang mở...</p>}
          {error && <p role="alert" style={{ color: 'var(--red-fg)' }}>{error}</p>}
          {loading && <p>Đang tải media…</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {items.map((item) => {
              const status = effectiveStatus(item)
              const canApprove = approvable.includes(item)
              return (
                <article key={item.localMediaId} className="odm-card" style={{ overflow: 'hidden', marginBottom: 0 }}>
                  {item.mediaType === 'IMAGE'
                    ? <img src={operatorMediaApi.previewUrl(item.localMediaId)} alt={item.fileName} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'contain', background: '#222' }} />
                    : <video src={operatorMediaApi.previewUrl(item.localMediaId)} controls preload="metadata" style={{ width: '100%', aspectRatio: '16 / 9', background: '#222' }} />}
                  <div style={{ padding: 14 }}>
                    <div className="odm-mono" style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{item.fileName}</div>
                    <div style={{ color: 'var(--tx3)', fontSize: 12, margin: '6px 0' }}>{item.mediaType} · {(item.fileSize / 1_000_000).toFixed(2)} MB · {status}</div>
                    {item.previewError && <p role="alert" style={{ color: 'var(--red-fg)' }}>{item.previewError}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" className="odm-btn odm-btn-p" disabled={!!busyId || !canApprove} onClick={() => void approve(item)}>{busyId === item.localMediaId ? 'Đang xử lý…' : 'Duyệt & upload'}</button>
                      <button type="button" className="odm-btn" disabled={!!busyId || !(['REVIEW_PENDING', 'UPLOAD_FAILED'].includes(item.status) || status === 'AVAILABLE')} onClick={() => void discard(item)}>{status === 'AVAILABLE' ? 'Xóa bản local' : 'Discard'}</button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
          <MediaTable files={files} retryingId={busyId} onRetry={(id) => { const item = items.find((entry) => entry.localMediaId === id); if (item) void approve(item) }} />
        </div>
      </div>
    </div>
  )
}
