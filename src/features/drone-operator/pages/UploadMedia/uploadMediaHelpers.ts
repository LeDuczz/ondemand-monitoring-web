import type { LocalMedia } from '../../../media/api/operatorMediaApi'
import { operatorMediaApi } from '../../../media/api/operatorMediaApi'
import type { EvidenceCandidate } from '../../../mission/types/checklistExecution'
import type { MediaFile } from '../../types/mission'

export const finishedUploadStatuses = new Set([
  'PENDING_MANAGER_APPROVAL',
  'AVAILABLE',
])
export const visibleAfterControllerDropStatuses = new Set([
  'UPLOADING',
  'VALIDATING',
  'PENDING_MANAGER_APPROVAL',
  'AVAILABLE',
])

/** Maps a backend media status to a chip tone. */
export function statusTone(status: string) {
  if (/FAIL|REJECT|ERROR|MANUAL_UPLOAD_REQUIRED/.test(status))
    return 'is-danger'
  if (/PENDING|VALIDATING|UPLOADING|REVIEW/.test(status)) return 'is-warning'
  if (/AVAILABLE|UPLOADED|VALIDATED|STORED|COMPLETED|READY/.test(status))
    return 'is-success'
  return ''
}

/** Local (not yet uploaded) media offered as checklist evidence candidates. */
export function localEvidenceCandidates(
  items: LocalMedia[],
  backendIds: Set<string>,
  effectiveStatus: (item: LocalMedia) => string,
  canManageMedia: boolean,
): EvidenceCandidate[] {
  return items
    .filter(
      (item) => !item.backendMediaId || !backendIds.has(item.backendMediaId),
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
        ineligibilityReason: attachable ? null : 'EVIDENCE_SOURCE_NOT_ELIGIBLE',
        previewUrl:
          item.localAvailable === false
            ? null
            : operatorMediaApi.previewUrl(item.localMediaId),
        urlExpiresAt: null,
        alreadyAttachedExecutionIds: [],
      }
    })
}

/** Maps local media items to the file rows shown in the table. */
export function toMediaFiles(
  items: LocalMedia[],
  effectiveStatus: (item: LocalMedia) => string,
  attemptNumbers: Record<string, number>,
): MediaFile[] {
  return items.map((item) => {
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
}
