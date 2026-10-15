import type { ReactNode } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  operatorMediaApi,
  type LocalMedia,
} from '../../../../media/api/operatorMediaApi'
import { PcBackupPicker } from '../../../../media/components/PcBackupPicker'
import { statusTone } from '../uploadMediaHelpers'
import { MediaCardActions } from './MediaCardActions'
import { mediaCardMessages } from './MediaCard.messages'

/** One media item: preview thumbnail, metadata, status and actions. */
export function MediaCard({
  item,
  status,
  canApprove,
  canManageMedia,
  isBusy,
  processing,
  attachFailure,
  attachSection,
  onApprove,
  onPreview,
  onDiscard,
  onUploadPc,
}: {
  item: LocalMedia
  status: string
  canApprove: boolean
  canManageMedia: boolean
  isBusy: boolean
  processing: boolean
  attachFailure?: string
  attachSection: ReactNode
  onApprove: (manual?: boolean) => void
  onPreview: () => void
  onDiscard: () => void
  onUploadPc: (file: File) => void
}) {
  const { t } = useI18n(mediaCardMessages)
  const typeLabel: Record<string, string> = t.mediaType
  const sourceLabel: Record<string, string> = t.mediaSource
  const statusLabel: Record<string, string> = t.mediaStatus
  return (
    <article className="upload-media-card">
      <div className="upload-media-thumb">
        {item.localAvailable === false ? (
          <p className="upload-media-unavailable">{t.unavailable}</p>
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
            onClick={onPreview}
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
          <span>{typeLabel[item.mediaType] ?? item.mediaType}</span>
          <span aria-hidden="true">•</span>
          <span>{(item.fileSize / 1_000_000).toFixed(2)} MB</span>
          {item.sourceType && (
            <>
              <span aria-hidden="true">•</span>
              <span>{sourceLabel[item.sourceType] ?? item.sourceType}</span>
            </>
          )}
        </div>
        <span className={`upload-media-status ${statusTone(status)}`}>
          {statusLabel[status] ?? status}
        </span>
        {item.previewError && (
          <p role="alert" className="upload-media-notice is-danger">
            {item.previewError}
          </p>
        )}
        <MediaCardActions
          item={item}
          status={status}
          canApprove={canApprove}
          canManageMedia={canManageMedia}
          isBusy={isBusy}
          processing={processing}
          onApprove={onApprove}
          onPreview={onPreview}
          onDiscard={onDiscard}
        />
        {attachSection}
        {attachFailure && (
          <p role="alert" className="upload-media-notice is-danger">
            {t.attachFailed(attachFailure)}
          </p>
        )}
        {canManageMedia &&
          item.manualTaskId &&
          ['MANUAL_UPLOAD_REQUIRED', 'UPLOAD_PENDING'].includes(status) && (
            <PcBackupPicker
              contentType={item.contentType}
              disabled={isBusy}
              onSelect={onUploadPc}
            />
          )}
      </div>
    </article>
  )
}
