import { ApiError } from '../../../../shared/api/httpClient'
import type { MissionChecklistResponse } from '../../../mission/types/checklistExecution'
import { missionResultReviewReadinessMessages } from './missionResultReviewReadiness.messages'

type ReadinessMessages = (typeof missionResultReviewReadinessMessages)['vi']

/** Present the canonical backend verdict; never reconstruct evidence eligibility or counts. */
export function missionResultReviewReadiness({
  missionId,
  missionStatus,
  checklist,
  loading = false,
  failed = false,
  t = missionResultReviewReadinessMessages.vi,
}: {
  missionId: string
  missionStatus: string
  checklist?: MissionChecklistResponse
  loading?: boolean
  failed?: boolean
  t?: ReadinessMessages
}) {
  const matching =
    !loading && !failed && checklist?.missionId === missionId
      ? checklist
      : undefined
  const missionComplete = missionStatus === 'COMPLETED'
  const finalReady = matching?.readyForFinalApproval === true
  const checklistReady = matching?.readyForSubmission === true || finalReady
  const blockers = matching
    ? [
        ...(matching.blockingReasons ?? []),
        ...matching.executions.flatMap((item) => item.blockingReasons ?? []),
      ]
    : []
  // A pending optional/unrelated media file must not override the canonical verdict.
  const mediaPending =
    !finalReady && blockers.includes('MEDIA_APPROVAL_REQUIRED')
  const ready = missionComplete && finalReady
  let reason: string | null = null
  if (loading) reason = t.checking
  else if (!matching) reason = t.unknown
  else if (!missionComplete) reason = t.missionNotComplete
  else if (!finalReady) {
    const blocker = mediaPending ? 'MEDIA_APPROVAL_REQUIRED' : blockers[0]
    reason = (blocker && t.reasons[blocker]) || t.checklistNotReady
  }
  return {
    ready,
    reason,
    missionComplete,
    checklistReady,
    mediaPending,
    known: !!matching,
  }
}

/** Keep the original error object in action state; never render its API message/code. */
export function missionResultReviewErrorMessage(
  error: unknown,
  t: ReadinessMessages = missionResultReviewReadinessMessages.vi,
): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return t.sessionExpired
    if (error.status === 403) return t.forbidden
    if (error.status === 404 || error.code === 'RESOURCE_NOT_FOUND')
      return t.notFound
    if (error.code === 'CHECKLIST_NOT_READY') return t.checklistNotReadyCode
    if (error.code === 'MISSION_STATUS_INVALID') return t.missionStatusInvalid
    if (error.code === 'CONCURRENT_UPDATE') return t.concurrentUpdate
  }
  return t.fallbackError
}
