import { useI18n } from '../../../../../shared/i18n'
import type { LocalMedia } from '../../../../media/api/operatorMediaApi'
import { finishedUploadStatuses } from '../uploadMediaHelpers'
import { mediaCardActionsMessages } from './MediaCardActions.messages'

/** Approve, manual upload, preview and discard actions of one media card. */
export function MediaCardActions({
  item,
  status,
  canApprove,
  canManageMedia,
  isBusy,
  processing,
  onApprove,
  onPreview,
  onDiscard,
}: {
  item: LocalMedia
  status: string
  canApprove: boolean
  canManageMedia: boolean
  isBusy: boolean
  processing: boolean
  onApprove: (manual?: boolean) => void
  onPreview: () => void
  onDiscard: () => void
}) {
  const { t } = useI18n(mediaCardActionsMessages)
  const canDiscard =
    ['REVIEW_PENDING', 'UPLOAD_FAILED'].includes(item.status) ||
    finishedUploadStatuses.has(status)
  return (
    <div className="upload-media-actions">
      {canManageMedia && status === 'MANUAL_UPLOAD_REQUIRED' && (
        <button
          type="button"
          className="odm-btn odm-btn-p"
          disabled={isBusy || item.localAvailable === false}
          onClick={() => onApprove(true)}
        >
          {t.manualUpload}
        </button>
      )}
      {canManageMedia && (
        <button
          type="button"
          className="odm-btn odm-btn-p"
          disabled={isBusy || !canApprove || item.localAvailable === false}
          onClick={() => onApprove()}
        >
          {processing ? t.processing : t.approveUpload}
        </button>
      )}
      {item.mediaType === 'IMAGE' && item.localAvailable !== false && (
        <button type="button" className="odm-btn" onClick={onPreview}>
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
              onClick={onDiscard}
            >
              {finishedUploadStatuses.has(status) ? t.deleteLocal : t.discard}
            </button>
          </div>
        </details>
      )}
    </div>
  )
}
