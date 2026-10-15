import { useId } from 'react'
import type { MissionChecklistResponse } from '../../../mission/types/checklistExecution'
import type {
  MissionResponse,
  MissionResultResponse,
} from '../../types/missions'
import { OrderIcon } from './OrderIcon'
import { formatDateTime, formatDuration } from './missionDetailHelpers'
import { MissionResultReviewActions } from './MissionResultReviewActions'
import { missionResultReviewReadiness } from './missionResultReviewReadiness'
import { missionResultReviewReadinessMessages } from './missionResultReviewReadiness.messages'
import './MissionResultReviewCard.css'
import { useI18n } from '../../../../shared/i18n'
import { missionResultReviewCardMessages } from './MissionResultReviewCard.messages'

export function MissionResultReviewCard({
  mission,
  result,
  checklist,
  checklistLoading = false,
  checklistFailed = false,
  refreshing = false,
  mediaCount: fallbackMediaCount = 0,
  locale = 'vi-VN',
  onReviewed,
  onViewMedia,
}: {
  mission: Pick<MissionResponse, 'id' | 'status'>
  result: MissionResultResponse | null
  checklist?: MissionChecklistResponse
  checklistLoading?: boolean
  checklistFailed?: boolean
  refreshing?: boolean
  mediaCount?: number
  locale?: 'vi-VN' | 'en-US'
  onReviewed: () => void
  onViewMedia?: () => void
}) {
  const { t, lang } = useI18n(missionResultReviewCardMessages)
  const { t: readinessT } = useI18n(missionResultReviewReadinessMessages)

  const headingId = useId()
  const reasonId = useId()
  const matchingResult = result?.missionId === mission.id ? result : null
  const readiness = missionResultReviewReadiness({
    missionId: mission.id,
    missionStatus: mission.status,
    checklist,
    loading: refreshing || checklistLoading,
    failed: checklistFailed,
    t: readinessT,
  })
  const mediaCount =
    matchingResult?.mediaCount ??
    matchingResult?.mediaFiles?.length ??
    fallbackMediaCount
  const pending = matchingResult?.approvalStatus === 'PENDING_MANAGER_APPROVAL'
  const conditions = [
    {
      label: readiness.missionComplete
        ? t.missionCompleted
        : t.missionNotCompleted,
      tone: readiness.missionComplete ? 'success' : 'warning',
    },
    {
      label: readiness.checklistReady
        ? t.checklistReady
        : readiness.known
          ? t.checklistNotReady
          : t.checklistNotConfirmed,
      tone: readiness.checklistReady
        ? 'success'
        : readiness.known
          ? 'warning'
          : 'neutral',
    },
    {
      label: mediaCount > 0 ? t.hasMedia : t.noMedia,
      tone: mediaCount > 0 ? 'success' : 'neutral',
    },
    ...(readiness.mediaPending
      ? [{ label: t.someMediaIsNotApproved, tone: 'warning' }]
      : []),
  ]
  return (
    <section
      className="odm-or-card odm-result-review"
      aria-labelledby={headingId}
    >
      <div className="odm-result-review-summary">
        <header className="odm-result-review-heading">
          <h2 id={headingId}>{t.missionResult}</h2>
          {matchingResult && (
            <div className="odm-or-result-line">
              <span
                className={`odm-or-pill odm-or-pill-${matchingResult.status === 'COMPLETED' ? 'green' : 'amber'}`}
              >
                {t.statusLabels[matchingResult.status] ?? t.unknown}
              </span>
              <span
                className={`odm-or-pill odm-or-pill-${matchingResult.approvalStatus === 'APPROVED' ? 'green' : matchingResult.approvalStatus === 'REJECTED' ? 'red' : 'amber'}`}
              >
                {t.approvalLabels[matchingResult.approvalStatus] ?? t.unknown}
              </span>
            </div>
          )}
        </header>
        {matchingResult ? (
          <>
            <dl className="odm-result-review-metrics">
              <div>
                <dt>{t.submittedAt}</dt>
                <dd>
                  {matchingResult.approvalStatus === 'DRAFT'
                    ? t.notSubmitted
                    : formatDateTime(matchingResult.submittedAt, locale)}
                </dd>
              </div>
              <div>
                <dt>{t.duration}</dt>
                <dd>{formatDuration(matchingResult.durationSeconds, lang)}</dd>
              </div>
              <div>
                <dt>{t.media}</dt>
                <dd>
                  {mediaCount}
                  {t.photosVideos}
                </dd>
              </div>
            </dl>
            {(matchingResult.summary || matchingResult.notes) && (
              <p className="odm-result-review-description">
                {matchingResult.summary || matchingResult.notes}
              </p>
            )}
          </>
        ) : (
          <p className="odm-result-review-empty">{t.noMissionResultHasBeen}</p>
        )}
      </div>
      {pending && (
        <section
          className="odm-result-review-readiness"
          aria-label={t.resultApprovalConditions}
        >
          <h3>{t.approvalConditions}</h3>
          <ul>
            {conditions.map((condition) => (
              <li key={condition.label} className={`is-${condition.tone}`}>
                <span
                  className="odm-result-review-condition-icon"
                  aria-hidden="true"
                >
                  <OrderIcon
                    name={
                      condition.tone === 'success'
                        ? 'check'
                        : condition.tone === 'warning'
                          ? 'alert'
                          : 'info'
                    }
                    size={15}
                  />
                </span>
                {condition.label}
              </li>
            ))}
          </ul>
          {readiness.reason && (
            <p
              id={reasonId}
              className="odm-result-review-warning"
              role="status"
            >
              {readiness.reason}
            </p>
          )}
          <div className="odm-result-review-media-helper">
            <span>{t.duyetMediaRiengTruocKhi}</span>
            {onViewMedia && (
              <button type="button" onClick={onViewMedia}>
                <OrderIcon name="media" size={15} />
                {t.viewMediaLibrary}
                <OrderIcon name="arrow-right" size={14} />
              </button>
            )}
          </div>
        </section>
      )}
      {matchingResult && (
        <div className="odm-result-review-action-section">
          {matchingResult.approvalStatus === 'REJECTED' &&
            matchingResult.reviewNote && (
              <div className="odm-result-review-recorded-note">
                <strong>{t.rejectionReason}</strong>
                <p>{matchingResult.reviewNote}</p>
              </div>
            )}
          <MissionResultReviewActions
            key={matchingResult.id}
            resultId={matchingResult.id}
            status={matchingResult.approvalStatus}
            ready={readiness.ready}
            refreshing={refreshing}
            disabledReasonId={readiness.reason ? reasonId : undefined}
            onReviewed={onReviewed}
          />
        </div>
      )}
    </section>
  )
}
