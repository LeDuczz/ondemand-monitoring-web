import { useCallback, useEffect, useRef, useState } from 'react'

import { useI18n } from '../../../shared/i18n'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../media/api/operatorMediaApi'
import { operatorMissionMediaApi } from '../../media/api/operatorMissionMediaApi'
import { MissionUploadedMedia } from '../../media/components/MissionUploadedMedia'
import { missionApi } from '../../mission/api/missionApi'
import { PcBackupPicker } from '../../media/components/PcBackupPicker'
import {
  getActiveMissionId,
  markActiveMissionFlowStep,
  setActiveMissionId,
} from '../api/liveMission'
import { useActiveMission } from '../api/useActiveMission'
import { formatDeviceLabel } from '../lib/deviceLabel'
import { flightControlApi } from '../omss/api/flightControlApi'
import { operatorHref } from '../routes'
import type { MediaFile } from '../types/mission'
import { FlightStepHeader } from './FlightStepper'
import { MediaTable } from './MediaTable'
import { uploadMediaScreenMessages } from './UploadMediaScreen.messages'
import { UploadMonitoringChecklist } from './UploadMonitoringChecklist'
import './UploadMediaScreen.css'
import { useMissionMonitoring } from '../../mission/hooks/useMissionMonitoring'
import { checklistEvidenceApi } from '../../mission/api/checklistEvidenceApi'
import { checklistExecutionApi } from '../../mission/api/checklistExecutionApi'

const finishedUploadStatuses = new Set([
  'PENDING_MANAGER_APPROVAL',
  'AVAILABLE',
])
const visibleAfterControllerDropStatuses = new Set([
  'UPLOADING',
  'VALIDATING',
  'PENDING_MANAGER_APPROVAL',
  'AVAILABLE',
])

/** Existing upload layout backed by the selected mission's local media. */
export function UploadMediaScreen({
  missionId: routeMissionId,
}: {
  missionId?: string
}) {
  const { t } = useI18n(uploadMediaScreenMessages)
  const [fallbackMissionId] = useState(() => getActiveMissionId())
  const missionId = routeMissionId ?? fallbackMissionId
  const activeMission = useActiveMission(missionId ?? undefined)
  const permissions = useApiQuery(
    () =>
      missionId
        ? missionApi.getPermissions(missionId)
        : Promise.reject(new Error('Select a mission first.')),
    [missionId, activeMission.data?.status],
  )
  const [items, setItems] = useState<LocalMedia[]>([])
  const [statuses, setStatuses] = useState<Record<string, string>>({})
  const [attemptNumbers, setAttemptNumbers] = useState<Record<string, number>>(
    {},
  )
  const [busyId, setBusyId] = useState<string | null>(null)
  const [batchUploading, setBatchUploading] = useState(false)
  const [checklistRevision, setChecklistRevision] = useState(0)
  const monitoring = useMissionMonitoring(missionId ?? '', checklistRevision)
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string[]>>({})
  const [attachFailures, setAttachFailures] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<LocalMedia | null>(null)
  const previewDialog = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Reference images (Mapillary) are stored by the backend directly, so they are already "uploaded".
  const [referenceCount, setReferenceCount] = useState(0)
  const [uploadInfo, setUploadInfo] = useState<string | null>(null)
  const itemsRef = useRef<LocalMedia[]>([])
  const uploadedMediaIds = useRef<Record<string, string>>({})
  useEffect(() => {
    setSelectedTargets({}); setAttachFailures({}); setItems([]); itemsRef.current = []; uploadedMediaIds.current = {}
  }, [missionId])
  useEffect(() => {
    if (preview) previewDialog.current?.showModal()
  }, [preview])

  useEffect(() => {
    if (!missionId) return
    setActiveMissionId(missionId)
    markActiveMissionFlowStep(missionId, 5)
  }, [missionId])

  const refresh = useCallback(async () => {
    if (!missionId) {
      setLoading(false)
      return
    }
    permissions.reload()
    try {
      const mission = activeMission.data
      const deviceId = mission?.deviceId
      if (deviceId) {
        await flightControlApi
          .bindSession(missionId, deviceId)
          .catch(() => undefined)
      }
      const media = await operatorMediaApi.reviewItems(
        missionId,
        mission?.missionCode ? [mission.missionCode] : [],
      )
      const previous = itemsRef.current
      const ids = [
        ...new Set(
          [...media, ...previous].flatMap((item) =>
            item.backendMediaId ? [item.backendMediaId] : [],
          ),
        ),
      ]
      const results = await Promise.allSettled(
        ids.map((id) => operatorMediaApi.status(id)),
      )
      const refreshedStatuses: Record<string, string> = {}
      results.forEach((result, index) => {
        if (result.status === 'fulfilled')
          refreshedStatuses[ids[index]] = result.value.status
      })
      setAttemptNumbers((previous) => {
        const next = { ...previous }
        results.forEach((result, index) => {
          if (result.status === 'fulfilled')
            next[ids[index]] = result.value.attemptNumber
        })
        return next
      })
      setStatuses((previous) => {
        const next = { ...previous, ...refreshedStatuses }
        return next
      })
      const merged = new Map<string, LocalMedia>(media.map((item) => [item.localMediaId, {
        ...item,
        backendMediaId: item.backendMediaId ?? uploadedMediaIds.current[item.localMediaId] ?? previous.find(old => old.localMediaId === item.localMediaId)?.backendMediaId,
      }]))
      for (const item of previous) {
        if (merged.has(item.localMediaId) || !item.backendMediaId) continue
        const status = refreshedStatuses[item.backendMediaId] ?? item.status
        if (visibleAfterControllerDropStatuses.has(status)) {
          merged.set(item.localMediaId, {
            ...item,
            status: status as LocalMedia['status'],
            localAvailable: false,
          })
        }
      }
      const nextItems = [...merged.values()]
      itemsRef.current = nextItems
      setItems(nextItems)
      setError(null)
      void operatorMissionMediaApi
        .list(missionId, 0)
        .then((page) =>
          setReferenceCount(
            page.items.filter(
              (media) => media.sourceType === 'MAPILLARY_REFERENCE',
            ).length,
          ),
        )
        .catch(() => undefined)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.loadMediaFailed)
    } finally {
      setLoading(false)
    }
  }, [
    activeMission.data?.deviceId,
    activeMission.data?.missionCode,
    missionId,
    t,
    permissions.reload,
  ])

  useEffect(() => {
    void refresh()
    const timer = window.setInterval(() => void refresh(), 10000)
    return () => window.clearInterval(timer)
  }, [refresh])

  async function approve(item: LocalMedia, manual = false) {
    if (!canManageMedia) return false
    setBusyId(item.localMediaId)
    setError(null)
    try {
      const mediaId = await operatorMediaApi.upload(item, manual)
      uploadedMediaIds.current[item.localMediaId] = mediaId
      setStatuses((previous) => ({
        ...previous,
        [mediaId]: previous[mediaId] ?? 'VALIDATING',
      }))
      setItems((previous) => {
        const next = previous.map((entry) =>
          entry.localMediaId === item.localMediaId
            ? {
                ...entry,
                backendMediaId: mediaId,
                status: 'VALIDATING' as const,
              }
            : entry,
        )
        itemsRef.current = next
        return next
      })
      await attachSelected(item, mediaId)
      await refresh()
      return true
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.uploadFailed)
      return false
    } finally {
      setBusyId(null)
    }
  }

  async function attachSelected(item: LocalMedia, mediaId: string) {
    const ids = selectedTargets[item.localMediaId] ?? []
    if (!missionId || ids.length === 0) return
    try {
      // Fetch fresh package/versions for an explicit attach retry, never re-transfer the file.
      const latest = await checklistExecutionApi.getMissionChecklistExecutions(missionId)
      const targets = ids.map(id => {
        const row = latest.executions.find(execution => execution.id === id)
        if (!row) throw new Error('Mục checklist không còn thuộc Mission này.')
        return { executionId: id, expectedVersion: row.version }
      })
      await checklistEvidenceApi.batch(missionId, mediaId, targets)
      setAttachFailures(previous => { const next = { ...previous }; delete next[item.localMediaId]; return next })
    } catch (cause) {
      setAttachFailures(previous => ({ ...previous, [item.localMediaId]: cause instanceof Error ? cause.message : 'Không gắn được bằng chứng.' }))
    } finally { monitoring.reload(); setChecklistRevision(value => value + 1) }
  }

  async function discard(item: LocalMedia) {
    if (!canManageMedia || batchUploading) return
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
    if (!canManageMedia || batchUploading) return
    setBusyId(item.localMediaId)
    setError(null)
    try {
      const mediaId = await operatorMediaApi.uploadPcBackup(item, file)
      await attachSelected(item, mediaId)
      await refresh()
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Không upload được bản sao PC',
      )
    } finally {
      setBusyId(null)
    }
  }

  const effectiveStatus = (item: LocalMedia) =>
    (item.backendMediaId && statuses[item.backendMediaId]) || item.status
  const approvable = items.filter(
    (item) =>
      item.localAvailable !== false &&
      ['REVIEW_PENDING', 'UPLOAD_FAILED', 'RETRY_REQUIRED'].includes(
        effectiveStatus(item),
      ),
  )
  const files: MediaFile[] = items.map((item) => {
    const status = effectiveStatus(item)
    const uploadFinished = finishedUploadStatuses.has(status)
    return {
      id: item.localMediaId,
      name: item.fileName,
      type: item.mediaType === 'IMAGE' ? 'PHOTO' : 'VIDEO',
      sizeBytes: item.fileSize,
      progressPct: uploadFinished
        ? 100
        : status === 'VALIDATING'
          ? 90
          : status === 'UPLOADING'
            ? 50
            : 0,
      attempt: item.backendMediaId
        ? (attemptNumbers[item.backendMediaId] ?? 0)
        : 0,
      maxAttempts: 3,
      status: uploadFinished
        ? 'UPLOADED'
        : status === 'UPLOADING' || status === 'VALIDATING'
          ? 'UPLOADING'
          : status === 'UPLOAD_FAILED' ||
              status === 'RETRY_REQUIRED' ||
              status === 'MANUAL_UPLOAD_REQUIRED'
            ? 'FAILED'
            : 'PENDING_UPLOAD',
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
  const canManageMedia =
    !permissions.loading &&
    !permissions.error &&
    permissions.data?.canUploadMedia === true
  const isBusy = !!busyId || batchUploading
  const backRoute =
    canManageMedia && missionId
      ? operatorHref({ screen: 'missionDetail', missionId })
      : operatorHref({ screen: 'flight', missionId: missionId ?? undefined })

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title={t.stepTitle}
        missionId={missionId ?? t.openingMission}
        active={7}
        right={
          <span
            style={{
              padding: '6px 12px',
              borderRadius: 16,
              background: 'var(--sf3)',
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            {deviceLabel ?? '—'}
          </span>
        }
      />
      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="upload-media-summary">
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700 }}>
                {t.summary(
                  uploaded + referenceCount,
                  files.length + referenceCount,
                  uploading,
                  manual,
                )}
              </div>
              <div
                style={{ fontSize: 12.5, color: 'var(--tx3)', marginTop: 2 }}
              >
                {t.summaryNote}
              </div>
            </div>
            <a className="odm-btn" href={backRoute}>
              {canManageMedia ? t.backToResult : t.backToCockpit}
            </a>
            <button
              type="button"
              className="odm-btn"
              onClick={() => {
                setChecklistRevision((value) => value + 1)
                void refresh()
              }}
            >
              {t.refresh}
            </button>
            {canManageMedia ? (
              <button
                type="button"
                className="odm-btn odm-btn-p"
                disabled={!missionId || isBusy}
                onClick={() => {
                  void (async () => {
                    setUploadInfo(null)
                    if (approvable.length === 0) {
                      await refresh()
                      setUploadInfo(
                        referenceCount > 0
                          ? `Tất cả media đã được lưu (${referenceCount} ảnh tham chiếu). Không còn file nào chờ upload.`
                          : 'Không có file nào chờ upload.',
                      )
                      return
                    }
                    setBatchUploading(true)
                    try {
                      for (const item of approvable) {
                        if (!(await approve(item))) return
                      }
                      setUploadInfo(
                        'Đã gửi các file đang chờ. Trạng thái lưu/xác thực được cập nhật từ backend.',
                      )
                    } finally {
                      setBatchUploading(false)
                    }
                  })()
                }}
              >
                {t.uploadAll}
              </button>
            ) : (
              <span
                role="status"
                style={{
                  padding: '8px 12px',
                  borderRadius: 16,
                  background: 'var(--sf3)',
                  color: 'var(--tx2)',
                  fontWeight: 700,
                  fontSize: 12.5,
                }}
              >
                {t.viewOnly}
              </span>
            )}
          </div>
          {!missionId && !loading && <p role="alert">{t.restoringMission}</p>}
          {uploadInfo && (
            <p
              role="status"
              style={{ color: 'var(--green-fg, #15803d)', fontWeight: 600 }}
            >
              {uploadInfo}
            </p>
          )}
          {error && (
            <p role="alert" style={{ color: 'var(--red-fg)' }}>
              {error}
            </p>
          )}
          {loading && <p>{t.loadingMedia}</p>}
          {missionId && !canManageMedia && (
            <p role="status">
              {permissions.error
                ? t.permissionsUnavailable
                : permissions.loading
                  ? t.checkingPermissions
                  : t.uploadPermissionNote}
            </p>
          )}
          <div className="upload-media-workspace">
            <div className="upload-media-files">
              <div className="upload-media-grid">
                {items.map((item) => {
                  const status = effectiveStatus(item)
                  const canApprove = approvable.includes(item)
                  return (
                    <article
                      key={item.localMediaId}
                      className="odm-card"
                      style={{ overflow: 'hidden', marginBottom: 0 }}
                    >
                      {item.localAvailable === false ? (
                        <p style={{ padding: 14 }}>
                          Bản gốc trên Flight Controller không khả dụng. Chọn
                          bản sao PC để khôi phục.
                        </p>
                      ) : item.mediaType === 'IMAGE' ? (
                        <img
                          src={operatorMediaApi.previewUrl(item.localMediaId)}
                          alt={item.fileName}
                          className="upload-media-preview"
                        />
                      ) : (
                        <video
                          src={operatorMediaApi.previewUrl(item.localMediaId)}
                          controls
                          preload="metadata"
                          className="upload-media-preview"
                        />
                      )}
                      <div style={{ padding: 14 }}>
                        <div
                          className="odm-mono"
                          style={{ fontWeight: 700, overflowWrap: 'anywhere' }}
                        >
                          {item.fileName}
                        </div>
                        <div
                          style={{
                            color: 'var(--tx3)',
                            fontSize: 12,
                            margin: '6px 0',
                          }}
                        >
                          {item.mediaType} · {item.sourceType ?? 'Unknown/Legacy'} ·{' '}
                          {(item.fileSize / 1_000_000).toFixed(2)} MB · {status}
                        </div>
                        {item.previewError && (
                          <p role="alert" style={{ color: 'var(--red-fg)' }}>
                            {item.previewError}
                          </p>
                        )}
                        {item.mediaType === 'IMAGE' &&
                          item.localAvailable !== false && (
                            <button
                              type="button"
                              className="odm-btn"
                              onClick={() => setPreview(item)}
                            >
                              {t.enlargePreview}
                            </button>
                          )}
                        {canManageMedia ? (
                          <div style={{ display: 'flex', gap: 8 }}>
                            {status === 'MANUAL_UPLOAD_REQUIRED' && (
                              <button
                                type="button"
                                className="odm-btn odm-btn-p"
                                disabled={
                                  isBusy || item.localAvailable === false
                                }
                                onClick={() => void approve(item, true)}
                              >
                                Upload thủ công từ bản gốc
                              </button>
                            )}
                            <button
                              type="button"
                              className="odm-btn odm-btn-p"
                              disabled={
                                isBusy ||
                                !canApprove ||
                                item.localAvailable === false
                              }
                              onClick={() => void approve(item)}
                            >
                              {busyId === item.localMediaId
                                ? t.processing
                                : t.approveUpload}
                            </button>
                            <button
                              type="button"
                              className="odm-btn"
                              disabled={
                                isBusy ||
                                !(
                                  ['REVIEW_PENDING', 'UPLOAD_FAILED'].includes(
                                    item.status,
                                  ) || finishedUploadStatuses.has(status)
                                )
                              }
                              onClick={() => void discard(item)}
                            >
                              {finishedUploadStatuses.has(status)
                                ? t.deleteLocal
                                : t.discard}
                            </button>
                          </div>
                        ) : null}
                        {monitoring.data?.permissions.canAttachChecklistEvidence === true && !monitoring.loading && !monitoring.error && <fieldset disabled={isBusy}>
                          <legend>Gắn vào checklist</legend>
                          {monitoring.data.checklist.executions.map(execution => <label key={execution.id} style={{ display: 'block', fontSize: 12, margin: '6px 0' }}>
                            <input type="checkbox" checked={(selectedTargets[item.localMediaId] ?? []).includes(execution.id)} onChange={event => setSelectedTargets(previous => {
                              const current = previous[item.localMediaId] ?? []
                              return { ...previous, [item.localMediaId]: event.target.checked ? [...current, execution.id] : current.filter(id => id !== execution.id) }
                            })} /> {execution.content} · {execution.eligibleEvidenceCount ?? 0}/{execution.minimumEvidenceCount ?? 0}
                          </label>)}
                          {item.backendMediaId && <button type="button" className="odm-btn" disabled={isBusy || !(selectedTargets[item.localMediaId]?.length)} onClick={() => {
                            const mediaId = item.backendMediaId
                            if (!mediaId) return
                            setBusyId(item.localMediaId)
                            void attachSelected(item, mediaId).finally(() => setBusyId(null))
                          }}>Gắn bằng chứng — không upload lại</button>}
                        </fieldset>}
                        {attachFailures[item.localMediaId] && <p role="alert">Media đã được giữ. Gắn bằng chứng chưa thành công: {attachFailures[item.localMediaId]}. Chọn “Gắn bằng chứng” để thử lại, không upload lại.</p>}
                        {canManageMedia &&
                          item.manualTaskId &&
                          ['MANUAL_UPLOAD_REQUIRED', 'UPLOAD_PENDING'].includes(
                            status,
                          ) && (
                            <PcBackupPicker
                              contentType={item.contentType}
                              disabled={isBusy}
                              onSelect={(file) => void uploadPc(item, file)}
                            />
                          )}
                      </div>
                    </article>
                  )
                })}
              </div>
              {canManageMedia ? (
                <MediaTable
                  files={files}
                  retryingId={busyId}
                  onRetry={(id) => {
                    if (isBusy) return
                    const item = items.find(
                      (entry) => entry.localMediaId === id,
                    )
                    if (item)
                      void approve(
                        item,
                        effectiveStatus(item) === 'MANUAL_UPLOAD_REQUIRED',
                      )
                  }}
                />
              ) : null}
            </div>
            {missionId && (
              <UploadMonitoringChecklist
                key={missionId}
                missionId={missionId}
                revision={checklistRevision}
              />
            )}
          </div>
          {canManageMedia && missionId ? (
            <div style={{ marginTop: 18 }}>
              <MissionUploadedMedia missionId={missionId} />
            </div>
          ) : null}
        </div>
      </div>
      {preview && (
        <dialog
          ref={previewDialog}
          className="upload-media-lightbox"
          aria-label={t.enlargePreview}
          onClose={() => setPreview(null)}
        >
          <button
            type="button"
            className="odm-btn"
            onClick={() => previewDialog.current?.close()}
          >
            {t.closePreview}
          </button>
          <img
            src={operatorMediaApi.previewUrl(preview.localMediaId)}
            alt={preview.fileName}
          />
        </dialog>
      )}
    </div>
  )
}
