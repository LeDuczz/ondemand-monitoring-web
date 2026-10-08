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
import type {
  EvidenceCandidate,
  MissionChecklistExecution,
} from '../../mission/types/checklistExecution'

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

const mediaTypeLabel: Record<string, string> = {
  IMAGE: 'Ảnh',
  VIDEO: 'Video',
}
const mediaSourceLabel: Record<string, string> = {
  DRONE_CAMERA: 'Camera drone',
  SATELLITE_SNAPSHOT: 'Ảnh vệ tinh',
  MANUAL_UPLOAD: 'Upload thủ công',
  MAPILLARY_REFERENCE: 'Ảnh tham chiếu Mapillary',
}
const mediaStatusLabel: Record<string, string> = {
  REVIEW_PENDING: 'Chờ duyệt',
  UPLOADING: 'Đang upload',
  UPLOAD_FAILED: 'Upload thất bại',
  VALIDATING: 'Đang xác thực',
  MANUAL_UPLOAD_REQUIRED: 'Cần upload thủ công',
  UPLOAD_PENDING: 'Chờ upload',
  RETRY_REQUIRED: 'Cần thử lại',
  PENDING_MANAGER_APPROVAL: 'Đã xác thực',
  AVAILABLE: 'Đã duyệt',
  UPLOADED: 'Đã upload',
}

/** Existing upload layout backed by the selected mission's local media. */
/** Maps a backend media status to a chip tone. */
function statusTone(status: string) {
  if (/FAIL|REJECT|ERROR|MANUAL_UPLOAD_REQUIRED/.test(status)) return 'is-danger'
  if (/PENDING|VALIDATING|UPLOADING|REVIEW/.test(status)) return 'is-warning'
  if (/AVAILABLE|UPLOADED|VALIDATED|STORED|COMPLETED|READY/.test(status)) return 'is-success'
  return ''
}

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
  const monitoring = useMissionMonitoring(missionId ?? '', checklistRevision, {
    autoRefresh: false,
  })
  const [selectedTargets, setSelectedTargets] = useState<Record<string, string[]>>({})
  const [attachFailures, setAttachFailures] = useState<Record<string, string>>({})
  const [preview, setPreview] = useState<LocalMedia | null>(null)
  const previewDialog = useRef<HTMLDialogElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Reference images (Mapillary) are stored by the backend directly, so they are already "uploaded".
  const [referenceCount, setReferenceCount] = useState(0)
  const [uploadInfo, setUploadInfo] = useState<string | null>(null)
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [sort, setSort] = useState<'newest' | 'oldest'>('newest')
  const [filter, setFilter] = useState<'all' | 'pending' | 'uploaded'>('all')
  const [completionSubmitting, setCompletionSubmitting] = useState(false)
  const [resultSentLocally, setResultSentLocally] = useState(false)
  const itemsRef = useRef<LocalMedia[]>([])
  const uploadedMediaIds = useRef<Record<string, string>>({})
  useEffect(() => {
    setSelectedTargets({}); setAttachFailures({}); setItems([]); setResultSentLocally(false); itemsRef.current = []; uploadedMediaIds.current = {}
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
  }, [refresh])

  async function approve(item: LocalMedia, manual = false) {
    if (!canManageMedia || !missionId) return false
    setBusyId(item.localMediaId)
    setError(null)
    try {
      const mediaId = await operatorMediaApi.upload(
        { ...item, missionId },
        manual,
      )
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

  async function loadEvidenceCandidates(page: number) {
    if (!missionId) return []
    const uploadedCandidates = await checklistEvidenceApi.candidates(
      missionId,
      page,
    )
    if (page > 0) return uploadedCandidates

    const backendIds = new Set(
      uploadedCandidates.map((candidate) => candidate.mediaId),
    )
    const localCandidates: EvidenceCandidate[] = itemsRef.current
      .filter(
        (item) =>
          !item.backendMediaId || !backendIds.has(item.backendMediaId),
      )
      .map((item) => {
        const status = effectiveStatus(item)
        const sourceEligible =
          item.sourceType === 'DRONE_CAMERA' ||
          item.sourceType === 'SATELLITE_SNAPSHOT'
        const attachable =
          canManageMedia &&
          item.localAvailable !== false &&
          sourceEligible &&
          (item.mediaType === 'IMAGE' || item.mediaType === 'VIDEO')
        return {
          mediaId: `local:${item.localMediaId}`,
          fileName: item.fileName,
          mediaType: item.mediaType,
          contentType: item.contentType,
          status: finishedUploadStatuses.has(status)
            ? status === 'AVAILABLE'
              ? 'AVAILABLE'
              : 'PENDING_MANAGER_APPROVAL'
            : status === 'VALIDATING'
              ? 'VALIDATING'
              : 'UPLOAD_PENDING',
          sourceType: item.sourceType ?? null,
          capturedAt: item.capturedAt,
          validatedAt: null,
          attachable,
          eligibleForOperationalReadiness: false,
          eligibleForFinalApproval: false,
          ineligibilityReason: attachable
            ? null
            : 'EVIDENCE_SOURCE_NOT_ELIGIBLE',
          previewUrl:
            item.localAvailable === false
              ? null
              : operatorMediaApi.previewUrl(item.localMediaId),
          urlExpiresAt: null,
          alreadyAttachedExecutionIds: [],
        }
      })
    return [...localCandidates, ...uploadedCandidates]
  }

  async function attachEvidenceCandidate(
    candidate: EvidenceCandidate,
    execution: MissionChecklistExecution,
  ) {
    if (!missionId) return
    let mediaId = candidate.mediaId

    if (candidate.mediaId.startsWith('local:')) {
      const localId = candidate.mediaId.slice('local:'.length)
      const item = itemsRef.current.find(
        (entry) => entry.localMediaId === localId,
      )
      if (!item) throw new Error('Media local không còn khả dụng.')

      mediaId = item.backendMediaId ?? ''
      if (!mediaId) {
        setBusyId(item.localMediaId)
        mediaId = await operatorMediaApi.upload({ ...item, missionId }, false)
        uploadedMediaIds.current[item.localMediaId] = mediaId
        setItems((previous) => {
          const next = previous.map((entry) =>
            entry.localMediaId === item.localMediaId
              ? { ...entry, backendMediaId: mediaId, status: 'VALIDATING' as const }
              : entry,
          )
          itemsRef.current = next
          return next
        })
      }
    }

    try {
      const latest =
        await checklistExecutionApi.getMissionChecklistExecutions(missionId)
      const current = latest.executions.find(
        (item) => item.id === execution.id,
      )
      if (!current) throw new Error('Mục checklist không còn thuộc Mission này.')
      await checklistEvidenceApi.attach(
        missionId,
        current.id,
        mediaId,
        current.version,
      )
      setChecklistRevision((value) => value + 1)
      monitoring.reload()
      await refresh()
    } finally {
      setBusyId(null)
    }
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
    if (!canManageMedia || batchUploading || !missionId) return
    setBusyId(item.localMediaId)
    setError(null)
    try {
      const mediaId = await operatorMediaApi.uploadPcBackup(
        { ...item, missionId },
        file,
      )
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
  const resultApprovalStatus = monitoring.data?.result?.approvalStatus ?? null
  const resultSubmitted =
    resultApprovalStatus === 'PENDING_MANAGER_APPROVAL' ||
    resultApprovalStatus === 'APPROVED'
  const resultSentToManager = resultSubmitted || resultSentLocally
  const canCompleteMission =
    monitoring.data?.permissions.canCompleteMission === true
  const canSubmitMissionResult =
    monitoring.data?.permissions.canSubmitMissionResult === true
  const readyForMissionCompletion =
    monitoring.data?.checklist.readyForMissionCompletion === true
  const readyForSubmission =
    monitoring.data?.checklist.readyForSubmission === true
  const canSendManagerFromUpload =
    !!missionId &&
    canSubmitMissionResult &&
    !resultSentToManager
  const canCompleteFromUpload =
    !!missionId &&
    canCompleteMission &&
    readyForMissionCompletion &&
    (!canSubmitMissionResult || readyForSubmission || resultSentToManager)
  const isBusy = !!busyId || batchUploading
  const visibleItems = items
    .filter((item) => {
      if (filter === 'all') return true
      const done = finishedUploadStatuses.has(effectiveStatus(item))
      return filter === 'uploaded' ? done : !done
    })
    .sort((a, b) => {
      const diff = (Date.parse(a.capturedAt) || 0) - (Date.parse(b.capturedAt) || 0)
      return sort === 'newest' ? -diff : diff
    })
  const backRoute =
    canManageMedia && missionId
      ? operatorHref({ screen: 'missionDetail', missionId })
      : operatorHref({ screen: 'flight', missionId: missionId ?? undefined })

  function buildMissionResultPayload() {
    const mission = activeMission.data
    return {
      status: 'COMPLETED' as const,
      startedAt: null,
      endedAt: null,
      completedAt: new Date().toISOString(),
      summary: [
        `Mission ${mission?.missionCode ?? missionId} đã hoàn thành.`,
        `Thiết bị: ${deviceLabel ?? 'chưa rõ'}.`,
      ].join(' '),
      notes: 'Kết quả giám sát được gửi cho manager duyệt.',
    }
  }

  function uploadedBackendMediaIds() {
    return [
      ...new Set(
        itemsRef.current
          .filter((item) => {
            if (!item.backendMediaId) return false
            const status = statuses[item.backendMediaId] ?? item.status
            return finishedUploadStatuses.has(status)
          })
          .map((item) => item.backendMediaId as string),
      ),
    ]
  }

  async function attachUploadedEvidenceForMissingChecklist() {
    if (
      !missionId ||
      monitoring.data?.checklist.readyForSubmission === true ||
      monitoring.data?.permissions.canAttachChecklistEvidence !== true
    )
      return
    const latest = await checklistExecutionApi.getMissionChecklistExecutions(missionId)
    const targets = latest.executions
      .filter((execution) => {
        const required = execution.minimumEvidenceCount ?? 0
        const current = execution.eligibleEvidenceCount ?? 0
        return execution.executionStatus === 'COMPLETED' && required > current
      })
      .map((execution) => ({
        executionId: execution.id,
        expectedVersion: execution.version,
      }))
    if (targets.length === 0) return
    const mediaId = uploadedBackendMediaIds()[0]
    if (!mediaId) throw new Error(t.missingChecklistEvidence)
    await checklistEvidenceApi.batch(missionId, mediaId, targets)
    setChecklistRevision((value) => value + 1)
    monitoring.reload()
  }

  async function completeMissionFromUpload() {
    if (
      !missionId ||
      completionSubmitting ||
      (!canCompleteFromUpload && !canSendManagerFromUpload)
    )
      return
    setCompletionSubmitting(true)
    setError(null)
    setUploadInfo(null)
    try {
      await attachUploadedEvidenceForMissingChecklist()
      if (canCompleteMission) {
        await missionApi.completeMission(missionId)
      }
      if (canSubmitMissionResult && !resultSentToManager) {
        await missionApi.submitMissionResult(missionId, buildMissionResultPayload())
        setResultSentLocally(true)
        setUploadInfo(t.completeSubmitSuccess)
      } else {
        setUploadInfo(t.completeSuccess)
      }
      setChecklistRevision((value) => value + 1)
      monitoring.reload()
      await refresh()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.completeSubmitFailed)
      monitoring.reload()
    } finally {
      setCompletionSubmitting(false)
    }
  }

  const totalMedia = files.length + referenceCount
  const loadedMedia = uploaded + referenceCount
  const pendingMedia = Math.max(0, totalMedia - loadedMedia)
  const sendDisabled =
    resultSentToManager ||
    completionSubmitting ||
    (canSubmitMissionResult ? !canSendManagerFromUpload : !canCompleteFromUpload)
  const missionLabel = activeMission.data?.missionCode ?? missionId ?? t.openingMission

  return (
    <div className="odm-card upload-media-page" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title={t.stepTitle}
        missionId={missionLabel}
        idTitle={missionId ?? undefined}
        active={7}
        right={
          <span className="upload-media-device">{deviceLabel ?? '—'}</span>
        }
      />
      <div className="upload-media-body">
        <div className="upload-media-stack">
          <div className="upload-media-bar">
            <div className="upload-media-bar-main">
              <div className="upload-media-bar-head">
                <strong className="upload-media-bar-count">
                  {loadedMedia} / {totalMedia}
                </strong>
                <span>{t.mediaLoaded}</span>
                <span className="upload-media-chips">
                  {loadedMedia > 0 && (
                    <span className="upload-media-status is-success">
                      {t.uploadedChip(loadedMedia)}
                    </span>
                  )}
                  {pendingMedia > 0 && (
                    <span className="upload-media-status is-warning">
                      {t.pendingChip(pendingMedia)}
                    </span>
                  )}
                  {uploading > 0 && (
                    <span className="upload-media-status is-info">
                      {t.uploadingChip(uploading)}
                    </span>
                  )}
                  {manual > 0 && (
                    <span className="upload-media-status is-danger">
                      {t.manualChip(manual)}
                    </span>
                  )}
                </span>
              </div>
              <div
                className="upload-media-progress"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={totalMedia}
                aria-valuenow={loadedMedia}
                aria-label={t.summary(loadedMedia, totalMedia, uploading, manual)}
              >
                <span
                  style={{
                    width: totalMedia
                      ? `${Math.round((loadedMedia / totalMedia) * 100)}%`
                      : '0%',
                  }}
                />
              </div>
              <small className="upload-media-bar-note">{t.summaryNote}</small>
            </div>
            <div className="upload-media-bar-actions">
              <a className="odm-btn upload-media-btn-ghost" href={backRoute}>
                <span aria-hidden="true">←</span>
                {canManageMedia ? t.backToResult : t.backToCockpit}
              </a>
              <button
                type="button"
                className="odm-btn upload-media-btn-ghost"
                onClick={() => {
                  setChecklistRevision((value) => value + 1)
                  void refresh()
                }}
              >
                <span aria-hidden="true">↻</span>
                {t.refresh}
              </button>
              {canManageMedia ? (
                <button
                  type="button"
                  className="odm-btn upload-media-btn-accent"
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
                <span role="status" className="upload-media-viewonly">
                  {t.viewOnly}
                </span>
              )}
              {canCompleteMission || canSubmitMissionResult || resultSentToManager ? (
                <button
                  type="button"
                  className="odm-btn odm-btn-p upload-media-btn-final"
                  disabled={sendDisabled}
                  title={sendDisabled && !resultSentToManager ? t.sendBlocked : undefined}
                  onClick={() => void completeMissionFromUpload()}
                >
                  {completionSubmitting
                    ? t.completing
                    : resultSentToManager
                      ? t.submittedToManager
                      : canSubmitMissionResult
                        ? t.completeAndSubmit
                        : t.completeOnly}
                </button>
              ) : null}
            </div>
          </div>
          {!missionId && !loading && <p role="alert">{t.restoringMission}</p>}
          {uploadInfo && (
            <p role="status" className="upload-media-notice is-success">
              {uploadInfo}
            </p>
          )}
          {error && (
            <p role="alert" className="upload-media-notice is-danger">
              {error}
            </p>
          )}
          {loading && <p>{t.loadingMedia}</p>}
          {missionId && !canManageMedia && (
            <p role="status" className="upload-media-notice">
              {permissions.error
                ? t.permissionsUnavailable
                : permissions.loading
                  ? t.checkingPermissions
                  : t.uploadPermissionNote}
            </p>
          )}
          <div className="upload-media-workspace">
            <div className="upload-media-files">
              <section className="upload-media-panel" aria-label={t.mediaList}>
                <header className="upload-media-toolbar">
                  <h2>{t.mediaList}</h2>
                  <span className="upload-media-count">{t.fileCount(items.length)}</span>
                  <div className="upload-media-tools">
                    <select
                      aria-label={t.filterLabel}
                      value={filter}
                      onChange={(event) => setFilter(event.target.value as typeof filter)}
                    >
                      <option value="all">{t.filterAll}</option>
                      <option value="pending">{t.filterPending}</option>
                      <option value="uploaded">{t.filterUploaded}</option>
                    </select>
                    <select
                      aria-label={t.sortLabel}
                      value={sort}
                      onChange={(event) => setSort(event.target.value as typeof sort)}
                    >
                      <option value="newest">{t.sortNewest}</option>
                      <option value="oldest">{t.sortOldest}</option>
                    </select>
                    <span className="upload-media-seg" role="group">
                      <button
                        type="button"
                        aria-pressed={view === 'grid'}
                        aria-label={t.gridView}
                        title={t.gridView}
                        onClick={() => setView('grid')}
                      >
                        ▦
                      </button>
                      <button
                        type="button"
                        aria-pressed={view === 'list'}
                        aria-label={t.listView}
                        title={t.listView}
                        onClick={() => setView('list')}
                      >
                        ☰
                      </button>
                    </span>
                  </div>
                </header>
                {!loading && visibleItems.length === 0 && (
                  <p className="upload-media-empty">{t.emptyMedia}</p>
                )}
                <div className={`upload-media-grid${view === 'list' ? ' is-list' : ''}`}>
                  {visibleItems.map((item) => {
                    const status = effectiveStatus(item)
                    const canApprove = approvable.includes(item)
                    const targetCount = selectedTargets[item.localMediaId]?.length ?? 0
                    const canDiscard =
                      ['REVIEW_PENDING', 'UPLOAD_FAILED'].includes(item.status) ||
                      finishedUploadStatuses.has(status)
                    return (
                      <article key={item.localMediaId} className="upload-media-card">
                        <div className="upload-media-thumb">
                          {item.localAvailable === false ? (
                            <p className="upload-media-unavailable">
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
                          {item.mediaType === 'IMAGE' && item.localAvailable !== false && (
                            <button
                              type="button"
                              className="upload-media-expand"
                              aria-hidden="true"
                              tabIndex={-1}
                              onClick={() => setPreview(item)}
                            >
                              ⛶
                            </button>
                          )}
                        </div>
                        <div className="upload-media-card-body">
                          <div className="odm-mono upload-media-filename" title={item.fileName}>
                            {item.fileName}
                          </div>
                          <div className="upload-media-meta">
                            <span>{mediaTypeLabel[item.mediaType] ?? item.mediaType}</span>
                            <span aria-hidden="true">•</span>
                            <span>{(item.fileSize / 1_000_000).toFixed(2)} MB</span>
                            {item.sourceType && (
                              <>
                                <span aria-hidden="true">•</span>
                                <span>{mediaSourceLabel[item.sourceType] ?? item.sourceType}</span>
                              </>
                            )}
                          </div>
                          <span className={`upload-media-status ${statusTone(status)}`}>
                            {mediaStatusLabel[status] ?? status}
                          </span>
                          {item.previewError && (
                            <p role="alert" className="upload-media-notice is-danger">
                              {item.previewError}
                            </p>
                          )}
                          <div className="upload-media-actions">
                            {canManageMedia && status === 'MANUAL_UPLOAD_REQUIRED' && (
                              <button
                                type="button"
                                className="odm-btn odm-btn-p"
                                disabled={isBusy || item.localAvailable === false}
                                onClick={() => void approve(item, true)}
                              >
                                Upload thủ công từ bản gốc
                              </button>
                            )}
                            {canManageMedia && (
                              <button
                                type="button"
                                className="odm-btn odm-btn-p"
                                disabled={isBusy || !canApprove || item.localAvailable === false}
                                onClick={() => void approve(item)}
                              >
                                {busyId === item.localMediaId ? t.processing : t.approveUpload}
                              </button>
                            )}
                            {item.mediaType === 'IMAGE' && item.localAvailable !== false && (
                              <button
                                type="button"
                                className="odm-btn"
                                onClick={() => setPreview(item)}
                              >
                                <span aria-hidden="true">{t.viewShort}</span>
                                <span className="upload-media-sr">{t.enlargePreview}</span>
                              </button>
                            )}
                            {canManageMedia && (
                              <details className="upload-media-more">
                                <summary aria-label={t.moreActions} title={t.moreActions}>
                                  ⋮
                                </summary>
                                <div className="upload-media-menu">
                                  <button
                                    type="button"
                                    className="odm-btn"
                                    disabled={isBusy || !canDiscard}
                                    onClick={() => void discard(item)}
                                  >
                                    {finishedUploadStatuses.has(status)
                                      ? t.deleteLocal
                                      : t.discard}
                                  </button>
                                </div>
                              </details>
                            )}
                          </div>
                          {monitoring.data?.permissions.canAttachChecklistEvidence === true &&
                            !monitoring.loading &&
                            !monitoring.error && (
                              <details
                                className="upload-media-attach-wrap"
                                open={targetCount > 0}
                              >
                                <summary>
                                  {t.attachToChecklist}
                                  {targetCount > 0 && (
                                    <span className="upload-media-chip">
                                      {t.attachSelected(targetCount)}
                                    </span>
                                  )}
                                </summary>
                                <fieldset disabled={isBusy} className="upload-media-attach">
                                  {monitoring.data.checklist.executions.map((execution) => (
                                    <label key={execution.id} className="upload-media-attach-row">
                                      <input
                                        type="checkbox"
                                        checked={(selectedTargets[item.localMediaId] ?? []).includes(execution.id)}
                                        onChange={(event) =>
                                          setSelectedTargets((previous) => {
                                            const current = previous[item.localMediaId] ?? []
                                            return {
                                              ...previous,
                                              [item.localMediaId]: event.target.checked
                                                ? [...current, execution.id]
                                                : current.filter((id) => id !== execution.id),
                                            }
                                          })
                                        }
                                      />
                                      <span>{execution.content}</span>
                                      <em>
                                        {execution.eligibleEvidenceCount ?? 0}/
                                        {execution.minimumEvidenceCount ?? 0}
                                      </em>
                                    </label>
                                  ))}
                                  {item.backendMediaId && (
                                    <button
                                      type="button"
                                      className="odm-btn"
                                      disabled={isBusy || !targetCount}
                                      onClick={() => {
                                        const mediaId = item.backendMediaId
                                        if (!mediaId) return
                                        setBusyId(item.localMediaId)
                                        void attachSelected(item, mediaId).finally(() =>
                                          setBusyId(null),
                                        )
                                      }}
                                    >
                                      Gắn bằng chứng — không upload lại
                                    </button>
                                  )}
                                </fieldset>
                              </details>
                            )}
                          {attachFailures[item.localMediaId] && (
                            <p role="alert" className="upload-media-notice is-danger">
                              Media đã được giữ. Gắn bằng chứng chưa thành công:{' '}
                              {attachFailures[item.localMediaId]}. Chọn “Gắn bằng chứng” để thử lại, không upload lại.
                            </p>
                          )}
                          {canManageMedia &&
                            item.manualTaskId &&
                            ['MANUAL_UPLOAD_REQUIRED', 'UPLOAD_PENDING'].includes(status) && (
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
              </section>
              {canManageMedia ? (
                <details className="upload-media-table-wrap">
                  <summary>{t.fileTable(files.length)}</summary>
                  <MediaTable
                    files={files}
                    retryingId={busyId}
                    onRetry={(id) => {
                      if (isBusy) return
                      const item = items.find((entry) => entry.localMediaId === id)
                      if (item)
                        void approve(
                          item,
                          effectiveStatus(item) === 'MANUAL_UPLOAD_REQUIRED',
                        )
                    }}
                  />
                </details>
              ) : null}
              {canManageMedia && missionId ? (
                <div className="upload-media-uploaded">
                  <MissionUploadedMedia missionId={missionId} />
                </div>
              ) : null}
            </div>
            {missionId && (
              <UploadMonitoringChecklist
                key={missionId}
                missionId={missionId}
                revision={checklistRevision}
                loadEvidenceCandidates={loadEvidenceCandidates}
                attachEvidenceCandidate={attachEvidenceCandidate}
              />
            )}
          </div>
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
