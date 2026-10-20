import { useI18n } from '../../../../../shared/i18n'
import { staffResultError } from '../../../components/common/MissionResultActions'
import type { BackendMission } from '../../../api/liveMission'
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
  inspector,
  showManagerContact,
  manager,
}: {
  missionId: string | null
  resultError: unknown
  uploadInfo: string | null
  error: string | null
  loading: boolean
  canManageMedia: boolean
  permissionsError: unknown
  permissionsLoading: boolean
  /** Inspector assigned to the mission; their contact explains who can upload. */
  inspector?: NonNullable<BackendMission['staffAssignments']>[number]
  /** The viewer is the inspector, so the Manager is the one to contact. */
  showManagerContact: boolean
  manager: { name?: string; email?: string; phone?: string }
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
        <div
          role="status"
          className="upload-media-notice upload-media-contact"
        >
          <p>
            {permissionsError
              ? t.permissionsUnavailable
              : permissionsLoading
                ? t.checkingPermissions
                : t.uploadPermissionNote}
          </p>
          {!permissionsLoading && !permissionsError && inspector ? (
            <ContactRow
              title={
                showManagerContact ? t.managerContact : t.inspectorContact
              }
              name={
                (showManagerContact ? manager.name : inspector.staffName) ||
                t.notUpdated
              }
              detail={
                showManagerContact
                  ? manager.email || t.notUpdated
                  : `${t.responseStatus(inspector.responseStatus)}${
                      inspector.staffEmail ? ` · ${inspector.staffEmail}` : ''
                    }`
              }
              phone={showManagerContact ? manager.phone : inspector.staffPhone}
            />
          ) : null}
        </div>
      )}
    </>
  )
}

function ContactRow({
  title,
  name,
  detail,
  phone,
}: {
  title: string
  name: string
  detail: string
  phone?: string | null
}) {
  const { t } = useI18n(uploadMediaNoticesMessages)
  return (
    <div className="upload-media-contact-row">
      <div>
        <strong>{title}</strong>
        <span>{name}</span>
        <small>{detail}</small>
      </div>
      {phone ? (
        <a className="odm-btn odm-btn-p" href={`tel:${phone}`}>
          {t.call(phone)}
        </a>
      ) : (
        <span className="upload-media-contact-missing">
          {t.phoneNotUpdated}
        </span>
      )}
    </div>
  )
}
