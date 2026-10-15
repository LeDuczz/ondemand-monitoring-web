import { useI18n } from '../../../../../shared/i18n'
import { uploadProgressSummaryMessages } from './UploadProgressSummary.messages'

/** Uploaded/total counter, status chips and progress bar. */
export function UploadProgressSummary({
  loadedMedia,
  totalMedia,
  pendingMedia,
  uploading,
  manual,
}: {
  loadedMedia: number
  totalMedia: number
  pendingMedia: number
  uploading: number
  manual: number
}) {
  const { t } = useI18n(uploadProgressSummaryMessages)
  return (
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
  )
}
