import { useId, useState } from 'react'
import { missionsApi } from '../../api/missionsApi'
import type { MissionResultApprovalStatus } from '../../../mission/types/mission'
import { OrderIcon } from './OrderIcon'
import { missionResultReviewErrorMessage } from './missionResultReviewReadiness'
import { missionResultReviewReadinessMessages } from './missionResultReviewReadiness.messages'
import './MissionResultReviewCard.css'
import { useI18n } from '../../../../shared/i18n'
import { missionResultReviewActionsMessages } from './MissionResultReviewActions.messages'

export function MissionResultReviewActions({
  resultId,
  status,
  ready,
  refreshing = false,
  disabledReasonId,
  onReviewed,
}: {
  resultId: string
  status: MissionResultApprovalStatus
  ready: boolean
  refreshing?: boolean
  disabledReasonId?: string
  onReviewed: () => void
}) {
  const { t } = useI18n(missionResultReviewActionsMessages)
  const { t: readinessT } = useI18n(missionResultReviewReadinessMessages)

  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const noteId = useId()
  async function review(reject: boolean) {
    if (
      busy ||
      refreshing ||
      status !== 'PENDING_MANAGER_APPROVAL' ||
      (!reject && !ready)
    )
      return
    setBusy(true)
    setError(null)
    try {
      if (reject) await missionsApi.rejectMissionResult(resultId, note)
      else await missionsApi.approveMissionResult(resultId)
      setNote('')
      onReviewed()
    } catch (cause) {
      setError(cause)
      onReviewed()
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="odm-result-review-actions" aria-busy={busy}>
      {status === 'DRAFT' && <p>{t.draftResultNotSubmittedFor}</p>}
      {status === 'REJECTED' && <p>{t.ketQuaDaBiTu}</p>}
      {status === 'APPROVED' && <p>{t.theResultHasBeenApproved}</p>}
      {error != null && (
        <p className="odm-result-review-error" role="alert">
          {missionResultReviewErrorMessage(error, readinessT)}
        </p>
      )}
      {status === 'PENDING_MANAGER_APPROVAL' && (
        <>
          <div className="odm-result-review-note">
            <div className="odm-result-review-note-label">
              <label htmlFor={noteId}>{t.rejectionReason}</label>
              <span>{t.optional}</span>
            </div>
            <textarea
              id={noteId}
              value={note}
              onChange={(event) => setNote(event.target.value)}
              disabled={busy}
              rows={3}
              placeholder={t.enterAReasonIfThe}
            />
          </div>
          {!ready && !disabledReasonId && <p>{t.theChecklistIsNotReady}</p>}
          <div className="odm-result-review-buttons">
            <button
              type="button"
              className="odm-or-btn odm-result-review-reject"
              disabled={busy || refreshing}
              onClick={() => void review(true)}
            >
              <OrderIcon name="x" size={16} />
              {t.rejectResult}
            </button>
            <button
              type="button"
              className="odm-or-btn odm-or-btn-blue"
              disabled={busy || refreshing || !ready}
              aria-describedby={!ready ? disabledReasonId : undefined}
              onClick={() => void review(false)}
            >
              <OrderIcon name="check" size={16} />
              {t.approveResult}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
