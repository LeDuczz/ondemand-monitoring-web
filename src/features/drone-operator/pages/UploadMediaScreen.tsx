import { useCallback, useEffect, useRef, useState } from 'react'

import { useI18n } from '../../../shared/i18n'
import { operatorMediaApi, type LocalMedia } from '../../media/api/operatorMediaApi'
import { PcBackupPicker } from '../../media/components/PcBackupPicker'
import { missionApi } from '../../mission/api/missionApi'
import { getActiveMissionId, markActiveMissionFlowStep, setActiveMissionId } from '../api/liveMission'
import { useActiveMission } from '../api/useActiveMission'
import { formatDeviceLabel } from '../lib/deviceLabel'
import { flightControlApi } from '../omss/api/flightControlApi'
import { operatorHref } from '../routes'
import type { MediaFile } from '../types/mission'
import { FlightStepHeader } from './FlightStepper'
import { MediaTable } from './MediaTable'
import { uploadMediaScreenMessages } from './UploadMediaScreen.messages'

const postflightTelemetryKey = (missionId: string) =>
  `fieldwise.operator.postflightTelemetry.${missionId}`

const finishedUploadStatuses = new Set(['PENDING_MANAGER_APPROVAL', 'AVAILABLE'])
const visibleAfterControllerDropStatuses = new Set(['UPLOADING', 'VALIDATING', 'PENDING_MANAGER_APPROVAL', 'AVAILABLE'])

/** Existing upload layout backed by the selected mission's local media. */
export function UploadMediaScreen({ missionId: routeMissionId }: { missionId?: string }) {
  const { t } = useI18n(uploadMediaScreenMessages)
  const [fallbackMissionId] = useState(() => getActiveMissionId())
  const missionId = routeMissionId ?? fallbackMissionId
  const activeMission = useActiveMission(missionId ?? undefined)
  const [items, setItems] = useState<LocalMedia[]>([])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [attemptNumbers, setAttemptNumbers] = useState<Record<string, number>>({})
  const [busyId, setBusyId] = useState<string | null>(null)
  const [postflightBusy, setPostflightBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const itemsRef = useRef<LocalMedia[]>([])

  useEffect(() => {
    if (!missionId) return
    setActiveMissionId(missionId)
    markActiveMissionFlowStep(missionId, 5)
  }, [missionId])

  const refresh = useCallback(async () => {
    if (!missionId) { setLoading(false); return }
    try {
      const media = await operatorMediaApi.reviewItems(missionId)
      const previous = itemsRef.current
      const ids = [...new Set([...media, ...previous].flatMap((item) => item.backendMediaId ? [item.backendMediaId] : []))]
      const results = await Promise.allSettled(ids.map((id) => operatorMediaApi.status(id)))
      const refreshedStatuses: Record<string, string> = {}
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') refreshedStatuses[ids[index]] = result.value.status
      })
      setAttemptNumbers((previous) => {
        const next = { ...previous }
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') next[ids[index]] = result.value.attemptNumber
        })
        return next
      })
      setStatuses((previous) => {
        const next = { ...previous, ...refreshedStatuses }
        return next
      })
      const merged = new Map(media.map((item) => [item.localMediaId, item]))
      for (const item of previous) {
        if (merged.has(item.localMediaId) || !item.backendMediaId) continue
        const status = refreshedStatuses[item.backendMediaId] ?? item.status
        if (visibleAfterControllerDropStatuses.has(status)) {
          merged.set(item.localMediaId, { ...item, status: status as LocalMedia['status'], localAvailable: false })
        }
      }
      const nextItems = [...merged.values()]
      itemsRef.current = nextItems
      setItems(nextItems)
      setError(null)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.loadMediaFailed)
    } finally {
      setLoading(false)
    }
  }, [missionId, t])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function approve(item: LocalMedia, manual = false) {
    setBusyId(item.localMediaId)
    try {
      const mediaId = await operatorMediaApi.upload(item, manual)
      setStatuses((previous) => ({ ...previous, [mediaId]: previous[mediaId] ?? 'VALIDATING' }))
      setItems((previous) => {
        const next = previous.map((entry) => entry.localMediaId === item.localMediaId
          ? { ...entry, backendMediaId: mediaId, status: 'VALIDATING' as const }
          : entry)
        itemsRef.current = next
        return next
      })
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.uploadFailed)
    } finally {
      setBusyId(null)
    }
  }

  async function discard(item: LocalMedia) {
    if (!window.confirm(t.confirmDiscard(item.fileName))) return
    setBusyId(item.localMediaId)
    try {
      await operatorMediaApi.discard(item.localMediaId)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.deleteFailed)
    } finally {
      setBusyId(null)
    }
  }

  async function uploadPc(item: LocalMedia, file: File) {
    setBusyId(item.localMediaId)
    setError(null)
    try {
      await operatorMediaApi.uploadPcBackup(item, file)
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không upload được bản sao PC')
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
        throw new Error(t.notReadyForPostcheck(mission.status))
      }

      markActiveMissionFlowStep(missionId, 6)
      window.location.hash = operatorHref({ screen: 'postflight', missionId })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.postcheckTransitionFailed)
    } finally {
      setPostflightBusy(false)
    }
  }

  const effectiveStatus = (item: LocalMedia) => (item.backendMediaId && statuses[item.backendMediaId]) || item.status
  const approvable = items.filter((item) => ['REVIEW_PENDING', 'UPLOAD_FAILED', 'RETRY_REQUIRED'].includes(effectiveStatus(item)))
  const files: MediaFile[] = items.map((item) => {
    const status = effectiveStatus(item)
    const uploadFinished = finishedUploadStatuses.has(status)
    return {
      id: item.localMediaId, name: item.fileName,
      type: item.mediaType === 'IMAGE' ? 'PHOTO' : 'VIDEO', sizeBytes: item.fileSize,
      progressPct: uploadFinished ? 100 : status === 'VALIDATING' ? 90 : status === 'UPLOADING' ? 50 : 0,
      attempt: item.backendMediaId ? attemptNumbers[item.backendMediaId] ?? 0 : 0, maxAttempts: 3,
      status: uploadFinished ? 'UPLOADED' : status === 'UPLOADING' || status === 'VALIDATING' ? 'UPLOADING' : status === 'UPLOAD_FAILED' || status === 'RETRY_REQUIRED' || status === 'MANUAL_UPLOAD_REQUIRED' ? 'FAILED' : 'PENDING_UPLOAD',
      manualTaskCreated: status === 'MANUAL_UPLOAD_REQUIRED',
      validationPending: status === 'VALIDATING',
    }
  })
  const uploaded = files.filter((item) => item.status === 'UPLOADED').length
  const uploading = files.filter((item) => item.status === 'UPLOADING').length
  const manual = files.filter((item) => item.manualTaskCreated).length
  const deviceLabel = activeMission.data
    ? formatDeviceLabel(activeMission.data)
    : items[0]?.deviceId

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader title={t.stepTitle} missionId={missionId ?? t.openingMission} active={6}
        right={<span style={{ padding: '6px 12px', borderRadius: 16, background: 'var(--sf3)', fontWeight: 700, fontSize: 13 }}>{deviceLabel ?? '—'}</span>} />
      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center', padding: '12px 18px', borderRadius: 14, background: 'var(--sf)', border: '1.5px solid var(--bd)' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{t.summary(uploaded, files.length, uploading, manual)}</div>
              <div style={{ fontSize: 12.5, color: 'var(--tx3)', marginTop: 2 }}>{t.summaryNote}</div>
            </div>
            <a className="odm-btn" href={operatorHref({ screen: 'flight', missionId: missionId ?? undefined })}>{t.backToCockpit}</a>
            <button type="button" className="odm-btn odm-btn-ok" disabled={!missionId || postflightBusy} onClick={() => void continueToPostflight()}>
              {postflightBusy ? t.completingMission : t.completeMission}
            </button>
            <button type="button" className="odm-btn" onClick={() => void refresh()}>{t.refresh}</button>
            <button type="button" className="odm-btn odm-btn-p" disabled={!missionId || !!busyId || approvable.length === 0}
                  onClick={() => { void (async () => { for (const item of approvable) await approve(item) })() }}>{t.uploadAll}</button>
          </div>
          {!missionId && !loading && <p role="alert">{t.restoringMission}</p>}
          {error && <p role="alert" style={{ color: 'var(--red-fg)' }}>{error}</p>}
          {loading && <p>{t.loadingMedia}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {items.map((item) => {
              const status = effectiveStatus(item)
              const canApprove = approvable.includes(item)
              return (
                <article key={item.localMediaId} className="odm-card" style={{ overflow: 'hidden', marginBottom: 0 }}>
                  {item.localAvailable === false ? <p style={{ padding: 14 }}>Bản gốc trên Flight Controller không khả dụng. Chọn bản sao PC để khôi phục.</p> : item.mediaType === 'IMAGE'
                    ? <img src={operatorMediaApi.previewUrl(item.localMediaId)} alt={item.fileName} style={{ width: '100%', aspectRatio: '16 / 9', objectFit: 'contain', background: '#222' }} />
                    : <video src={operatorMediaApi.previewUrl(item.localMediaId)} controls preload="metadata" style={{ width: '100%', aspectRatio: '16 / 9', background: '#222' }} />}
                  <div style={{ padding: 14 }}>
                    <div className="odm-mono" style={{ fontWeight: 700, overflowWrap: 'anywhere' }}>{item.fileName}</div>
                    <div style={{ color: 'var(--tx3)', fontSize: 12, margin: '6px 0' }}>{item.mediaType} · {(item.fileSize / 1_000_000).toFixed(2)} MB · {status}</div>
                    {item.previewError && <p role="alert" style={{ color: 'var(--red-fg)' }}>{item.previewError}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      {status === 'MANUAL_UPLOAD_REQUIRED' && <button type="button" className="odm-btn odm-btn-p" disabled={!!busyId || item.localAvailable === false} onClick={() => void approve(item, true)}>Upload thủ công từ bản gốc</button>}
                      <button type="button" className="odm-btn odm-btn-p" disabled={!!busyId || !canApprove} onClick={() => void approve(item)}>{busyId === item.localMediaId ? t.processing : t.approveUpload}</button>
                      <button type="button" className="odm-btn" disabled={!!busyId || !(['REVIEW_PENDING', 'UPLOAD_FAILED'].includes(item.status) || finishedUploadStatuses.has(status))} onClick={() => void discard(item)}>{finishedUploadStatuses.has(status) ? t.deleteLocal : t.discard}</button>
                    </div>
                    {item.manualTaskId && ['MANUAL_UPLOAD_REQUIRED', 'UPLOAD_PENDING'].includes(status) &&
                      <PcBackupPicker contentType={item.contentType} disabled={!!busyId} onSelect={(file) => void uploadPc(item, file)} />}
                  </div>
                </article>
              )
            })}
          </div>
          <MediaTable files={files} retryingId={busyId} onRetry={(id) => { const item = items.find((entry) => entry.localMediaId === id); if (item) void approve(item, effectiveStatus(item) === 'MANUAL_UPLOAD_REQUIRED') }} />
        </div>
      </div>
    </div>
  )
}
