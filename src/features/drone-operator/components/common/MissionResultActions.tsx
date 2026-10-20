import { ApiError } from '../../../../shared/api/httpClient'
import { StatusBadge } from '../../../../shared/components/odm/StatusBadge'
import type { useMissionMonitoring } from '../../../mission/hooks/useMissionMonitoring'
import { getLanguage, useI18n } from '../../../../shared/i18n'
import { missionResultActionsMessages } from './MissionResultActions.messages'
import './MissionResultActions.css'

type Monitoring = ReturnType<typeof useMissionMonitoring>

/** Backend capabilities identify the actor; readiness and lifecycle identify the operation. */
export function missionResultActions(
  missionId: string,
  status: string | undefined,
  query: Monitoring,
) {
  const m = missionResultActionsMessages[getLanguage()]
  const data = query.data
  const known =
    !query.loading &&
    !query.error &&
    data?.checklist.missionId === missionId &&
    (!data.result || data.result.missionId === missionId)
  const submitted =
    known &&
    (data.result?.approvalStatus === 'PENDING_MANAGER_APPROVAL' ||
      data.result?.approvalStatus === 'APPROVED')
  const canComplete =
    known &&
    status === 'PENDING_REVIEW' &&
    data.permissions.canCompleteMission === true
  const canSubmit =
    known && data.permissions.canSubmitMissionResult === true && !submitted
  const completeReady =
    canComplete && data.checklist.readyForMissionCompletion === true
  const submitReady =
    canSubmit &&
    data.checklist.readyForSubmission === true &&
    (status === 'COMPLETED' ||
      (status === 'PENDING_REVIEW' && completeReady))
  const remaining =
    data?.checklist.executions.filter(
      (row) => !['COMPLETED', 'UNABLE_TO_VERIFY'].includes(row.executionStatus),
    ).length ?? 0
  const readinessReason = !known
    ? m.confirmingChecklist
    : remaining > 0
      ? m.remainingItems(remaining)
      : data.checklist.executions.some(
            (row) =>
              row.executionStatus === 'UNABLE_TO_VERIFY' &&
              !row.unableToVerifyReason?.trim(),
          )
        ? m.needUnableReason
        : data.checklist.blockingReasons?.includes(
              'CHECKLIST_INTEGRITY_INVALID',
            )
          ? m.integrityInvalid
          : data.checklist.blockingReasons?.includes('MEDIA_REJECTED')
            ? m.mediaRejected
            : data.checklist.blockingReasons?.includes('MEDIA_NOT_VALIDATED')
              ? m.mediaNotValidated
              : m.checklistNotReady
  return {
    known,
    submitted,
    canComplete,
    canSubmit,
    completeReady,
    submitReady,
    readinessReason,
  }
}

/** Keep the original error object in state for diagnostics; never present server internals. */
export function staffResultError(error: unknown) {
  const m = missionResultActionsMessages[getLanguage()]
  if (error instanceof ApiError) {
    if (error.status === 401) return m.sessionExpired
    if (error.status === 403) return m.forbidden
    if (error.code === 'MISSION_STATUS_INVALID') return m.statusInvalid
    if (error.code === 'CHECKLIST_EXECUTION_LOCKED') return m.executionLocked
    if (error.code === 'CHECKLIST_NOT_READY')
      return error.message.includes('EVIDENCE_TYPE_NOT_ELIGIBLE')
        ? m.wrongMediaType
        : error.message.includes('INSUFFICIENT_EVIDENCE')
          ? m.insufficientEvidence
          : m.checklistNotComplete
  }
  return m.genericError
}

export function MissionResultActions({
  missionId,
  status,
  monitoring,
  busy,
  onComplete,
  onSubmit,
  showComplete = true,
}: {
  missionId: string
  status?: string
  monitoring: Monitoring
  busy: boolean
  onComplete: () => void
  onSubmit: () => void
  showComplete?: boolean
}) {
  const { t } = useI18n(missionResultActionsMessages)
  const state = missionResultActions(missionId, status, monitoring)
  if (!['PENDING_REVIEW', 'COMPLETED'].includes(status ?? '')) return null
  const reasonId = `result-readiness-${missionId}`
  const submitReason =
    status !== 'COMPLETED' && !state.completeReady
      ? t.completeFirst
      : state.readinessReason
  return (
    <section className="staff-result-actions" aria-label={t.sectionAriaLabel}>
      <div className="staff-result-phase" role="status">
        {status === 'COMPLETED' ? t.completed : t.pendingReview}
        {state.submitted && (
          <>
            <span>
              {monitoring.data?.result?.approvalStatus === 'APPROVED'
                ? t.approvedNote
                : t.submittedNote}
            </span>
            <StatusBadge tone="green">
              {monitoring.data?.result?.approvalStatus === 'APPROVED'
                ? t.approvedBadge
                : t.pendingBadge}
            </StatusBadge>
          </>
        )}
      </div>
      {((showComplete && state.canComplete) || state.canSubmit) && (
        <div className="staff-result-buttons">
          {showComplete && state.canComplete && (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={busy || !state.completeReady}
              aria-describedby={!state.completeReady ? reasonId : undefined}
              onClick={onComplete}
            >
              {t.completeMission}
            </button>
          )}
          {state.canSubmit && (
            <button
              type="button"
              className={`odm-btn${status === 'COMPLETED' ? ' odm-btn-p' : ''}`}
              disabled={busy || !state.submitReady}
              aria-describedby={!state.submitReady ? reasonId : undefined}
              onClick={onSubmit}
            >
              {t.submitResult}
            </button>
          )}
        </div>
      )}
      {((state.canSubmit && !state.submitReady) ||
        (showComplete && state.canComplete && !state.completeReady)) && (
        <p id={reasonId} className="staff-result-reason">
          {showComplete && state.canComplete && !state.completeReady
            ? state.readinessReason
            : submitReason}
        </p>
      )}
      {busy && <p role="status">{t.processing}</p>}
      {!state.known && <p role="status">{t.confirmingChecklist}</p>}
    </section>
  )
}
