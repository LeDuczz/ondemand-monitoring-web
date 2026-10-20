import { useCallback, useEffect, useRef, useState } from 'react'

import { useI18n } from '../../../../shared/i18n'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../../media/api/operatorMediaApi'
import { operatorMissionMediaApi } from '../../../media/api/operatorMissionMediaApi'
import { missionApi } from '../../../mission/api/missionApi'
import {
  getActiveMissionId,
  markActiveMissionFlowStep,
  setActiveMissionId,
} from '../../api/liveMission'
import { useActiveMission } from '../../api/useActiveMission'
import { formatDeviceLabel } from '../../lib/deviceLabel'
import { flightControlApi } from '../../api/flightControlApi'
import { missionResultActions } from '../../components/common/MissionResultActions'
import { useMissionMonitoring } from '../../../mission/hooks/useMissionMonitoring'
import { checklistEvidenceApi } from '../../../mission/api/checklistEvidenceApi'
import { checklistExecutionApi } from '../../../mission/api/checklistExecutionApi'
import type {
  EvidenceCandidate,
  MissionChecklistExecution,
} from '../../../mission/types/checklistExecution'
import {
  localEvidenceCandidates,
  toMediaFiles,
  visibleAfterControllerDropStatuses,
} from './uploadMediaHelpers'
import { uploadMediaPageMessages } from './UploadMediaPage.messages'

/** State and operations of the upload-media workspace for one mission. */
export function useUploadMedia(routeMissionId?: string) {
  const { t } = useI18n(uploadMediaPageMessages)
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
  const [selectedTargets, setSelectedTargets] = useState<
    Record<string, string[]>
  >({})
  const [attachFailures, setAttachFailures] = useState<Record<string, string>>(
    {},
  )
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  // Reference images (Mapillary) are stored by the backend directly, so they are already "uploaded".
  const [referenceCount, setReferenceCount] = useState(0)
  const [uploadInfo, setUploadInfo] = useState<string | null>(null)
  const [completionSubmitting, setCompletionSubmitting] = useState(false)
  const [resultError, setResultError] = useState<unknown>(null)
  const itemsRef = useRef<LocalMedia[]>([])
  const uploadedMediaIds = useRef<Record<string, string>>({})
  useEffect(() => {
    setSelectedTargets({})
    setAttachFailures({})
    setItems([])
    itemsRef.current = []
    uploadedMediaIds.current = {}
  }, [missionId])

  useEffect(() => {
    if (!missionId) return
    setActiveMissionId(missionId)
    markActiveMissionFlowStep(missionId, 5)
  }, [missionId])

  const refresh = useCallback(async (options?: { background?: boolean }) => {
    if (!missionId) {
      setLoading(false)
      return
    }
    if (!options?.background) permissions.reload()
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
      const merged = new Map<string, LocalMedia>(
        media.map((item) => [
          item.localMediaId,
          {
            ...item,
            backendMediaId:
              item.backendMediaId ??
              uploadedMediaIds.current[item.localMediaId] ??
              previous.find((old) => old.localMediaId === item.localMediaId)
                ?.backendMediaId,
          },
        ]),
      )
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

  // Storage validation finishes in the background, after the upload itself. Keep asking the backend while any file
  // is still being checked, so "Đang xác thực" turns into "Đã upload" without a manual reload.
  const stillValidating = items.some((item) => {
    const status =
      (item.backendMediaId && statuses[item.backendMediaId]) || item.status
    return status === 'VALIDATING' || status === 'UPLOADING'
  })
  const wasValidating = useRef(false)
  useEffect(() => {
    // Once the last file finishes, reload the checklist counts and library once (the reloads keep what is on screen).
    if (wasValidating.current && !stillValidating) {
      setChecklistRevision((value) => value + 1)
    }
    wasValidating.current = stillValidating
  }, [stillValidating])
  useEffect(() => {
    if (!stillValidating || !missionId) return
    const startedAt = Date.now()
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt > 3 * 60_000) {
        window.clearInterval(timer)
        return
      }
      void refresh({ background: true })
    }, 2500)
    return () => window.clearInterval(timer)
  }, [stillValidating, missionId, refresh])

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
      refreshWorkspace()
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
      const latest =
        await checklistExecutionApi.getMissionChecklistExecutions(missionId)
      const targets = ids.map((id) => {
        const row = latest.executions.find((execution) => execution.id === id)
        if (!row) throw new Error(t.checklistItemGone)
        return { executionId: id, expectedVersion: row.version }
      })
      await checklistEvidenceApi.batch(missionId, mediaId, targets)
      setAttachFailures((previous) => {
        const next = { ...previous }
        delete next[item.localMediaId]
        return next
      })
    } catch (cause) {
      setAttachFailures((previous) => ({
        ...previous,
        [item.localMediaId]:
          cause instanceof Error ? cause.message : t.attachEvidenceFailed,
      }))
    } finally {
      refreshWorkspace()
    }
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
    const localCandidates = localEvidenceCandidates(
      itemsRef.current,
      backendIds,
      effectiveStatus,
      canManageMedia,
    )
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
      if (!item) throw new Error(t.localMediaUnavailable)

      mediaId = item.backendMediaId ?? ''
      if (!mediaId) {
        setBusyId(item.localMediaId)
        mediaId = await operatorMediaApi.upload({ ...item, missionId }, false)
        uploadedMediaIds.current[item.localMediaId] = mediaId
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
      }
    }

    try {
      const latest =
        await checklistExecutionApi.getMissionChecklistExecutions(missionId)
      const current = latest.executions.find((item) => item.id === execution.id)
      if (!current) throw new Error(t.checklistItemGone)
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
      refreshWorkspace()
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
      refreshWorkspace()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.pcBackupUploadFailed)
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
  const files = toMediaFiles(items, effectiveStatus, attemptNumbers)
  const uploaded = files.filter((item) => item.status === 'UPLOADED').length
  const uploading = files.filter((item) => item.status === 'UPLOADING').length
  const manual = files.filter((item) => item.manualTaskCreated).length
  const deviceLabel = activeMission.data
    ? formatDeviceLabel(activeMission.data)
    : items[0]?.deviceId
  // Permissions and the Mission stay usable while a background reload runs; only a failure or a first load removes them.
  const canManageMedia =
    !permissions.error && permissions.data?.canUploadMedia === true
  const inspector = activeMission.data?.staffAssignments?.find(
    (assignment) => assignment.assignedRole === 'INSPECTOR',
  )
  const showManagerContact = permissions.data?.canInspectDevice === true
  const missionStatus =
    activeMission.error ||
    activeMission.data?.id !== missionId
      ? undefined
      : activeMission.data?.status
  const actions = missionResultActions(
    missionId ?? '',
    missionStatus,
    monitoring,
  )
  const isBusy = !!busyId || batchUploading || completionSubmitting

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

  function refreshWorkspace(clearError = true) {
    if (clearError) setResultError(null)
    activeMission.reload()
    monitoring.reload()
    permissions.reload()
    setChecklistRevision((value) => value + 1)
    void refresh()
  }

  async function runResultAction(operation: 'complete' | 'submit') {
    if (
      !missionId ||
      completionSubmitting ||
      isBusy ||
      (operation === 'complete' ? !actions.completeReady : !actions.submitReady)
    )
      return
    setCompletionSubmitting(true)
    setResultError(null)
    setUploadInfo(null)
    try {
      if (operation === 'complete') {
        await missionApi.completeMission(missionId)
      } else {
        await missionApi.submitMissionResult(
          missionId,
          buildMissionResultPayload(),
        )
      }
    } catch (cause) {
      setResultError(cause)
    } finally {
      refreshWorkspace(false)
      setCompletionSubmitting(false)
    }
  }

  async function uploadAll() {
    setUploadInfo(null)
    if (approvable.length === 0) {
      await refresh()
      setUploadInfo(
        referenceCount > 0
          ? t.allMediaStored(referenceCount)
          : t.nothingToUpload,
      )
      return
    }
    setBatchUploading(true)
    try {
      for (const item of approvable) {
        if (!(await approve(item))) return
      }
      setUploadInfo(t.pendingSent)
    } finally {
      setBatchUploading(false)
    }
  }

  const totalMedia = files.length + referenceCount
  const loadedMedia = uploaded + referenceCount
  const pendingMedia = Math.max(0, totalMedia - loadedMedia)
  const missionLabel =
    activeMission.data?.missionCode ?? missionId ?? t.openingMission

  return {
    missionId,
    activeMission,
    permissions,
    monitoring,
    items,
    files,
    selectedTargets,
    setSelectedTargets,
    attachFailures,
    busyId,
    setBusyId,
    error,
    loading,
    uploadInfo,
    resultError,
    checklistRevision,
    canManageMedia,
    inspector,
    showManagerContact,
    missionStatus,
    actions,
    isBusy,
    approvable,
    effectiveStatus,
    uploaded,
    uploading,
    manual,
    deviceLabel,
    totalMedia,
    loadedMedia,
    pendingMedia,
    missionLabel,
    completionSubmitting,
    approve,
    attachSelected,
    discard,
    uploadPc,
    uploadAll,
    refreshWorkspace,
    runResultAction,
    loadEvidenceCandidates,
    attachEvidenceCandidate,
  }
}
