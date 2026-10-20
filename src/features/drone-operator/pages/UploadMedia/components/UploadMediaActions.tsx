import { useI18n } from '../../../../../shared/i18n'
import { operatorHref } from '../../../routes'
import { uploadMediaActionsMessages } from './UploadMediaActions.messages'

/** Back link, refresh and upload-all controls of the summary bar. */
export function UploadMediaActions({
  missionId,
  canManageMedia,
  isBusy,
  onRefresh,
  onUploadAll,
}: {
  missionId: string | null
  canManageMedia: boolean
  isBusy: boolean
  onRefresh: () => void
  onUploadAll: () => Promise<void>
}) {
  const { t } = useI18n(uploadMediaActionsMessages)
  // Upload media is part of the active flight flow, so the back action returns to the cockpit.
  const backRoute = operatorHref({
    screen: 'flight',
    missionId: missionId ?? undefined,
  })
  return (
    <div className="upload-media-bar-actions">
      <a className="odm-btn upload-media-btn-ghost" href={backRoute}>
        <span aria-hidden="true">←</span>
        {t.backToCockpit}
      </a>
      <button
        type="button"
        className="odm-btn upload-media-btn-ghost"
        onClick={onRefresh}
      >
        <span aria-hidden="true">↻</span>
        {t.refresh}
      </button>
      {canManageMedia ? (
        <button
          type="button"
          className="odm-btn upload-media-btn-ghost"
          disabled={!missionId || isBusy}
          onClick={() => {
            void onUploadAll()
          }}
        >
          {t.uploadAll}
        </button>
      ) : (
        <span role="status" className="upload-media-viewonly">
          {t.viewOnly}
        </span>
      )}
    </div>
  )
}
