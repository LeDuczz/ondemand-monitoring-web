import { useI18n } from '../../../../../shared/i18n'
import { staffResultError } from '../../../components/common/MissionResultActions'
import { uploadMediaNoticesMessages } from './UploadMediaNotices.messages'

/** Result/upload/error/loading/permission notices above the workspace. */
export function UploadMediaNotices({
  missionId,
  resultError,
  uploadInfo,
  error,
  loading,
  canManageMedia,
  permissionsError,
  permissionsLoading,
}: {
  missionId: string | null
  resultError: unknown
  uploadInfo: string | null
  error: string | null
  loading: boolean
  canManageMedia: boolean
  permissionsError: unknown
  permissionsLoading: boolean
}) {
  const { t } = useI18n(uploadMediaNoticesMessages)
  return (
    <>
      {resultError ? (
        <p role="alert" className="upload-media-notice is-danger">
          {staffResultError(resultError)}
        </p>
      ) : null}
      {uploadInfo && (
        <p role="status" className="upload-media-notice is-success">
          {uploadInfo}
        </p>
      )}
      {error && (
        <p role="alert" className="upload-media-notice is-danger">
          {error}
        </p>
      )}
      {loading && <p>{t.loadingMedia}</p>}
      {missionId && !canManageMedia && (
        <p role="status" className="upload-media-notice">
          {permissionsError
            ? t.permissionsUnavailable
            : permissionsLoading
              ? t.checkingPermissions
              : t.uploadPermissionNote}
        </p>
      )}
    </>
  )
}
