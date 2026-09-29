import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { authSession } from '../../../../auth/api/authApi'
import { adminUsersApi } from '../../../api/adminUsersApi'
import { Modal } from '../../../components/common/Modal'
import { EditUserForm } from './EditUserForm'
import { editUserModalMessages } from './EditUserModal.messages'

/** Loads `GET /api/admin/users/{id}` and shows only the fields the BE returns. */
export function EditUserModal({
  userId,
  onClose,
  onChanged,
}: {
  userId: string
  onClose: () => void
  onChanged: () => void
}) {
  const { t } = useI18n(editUserModalMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminUsersApi.getUser(userId, signal),
    [userId],
  )

  if (data) {
    return (
      <EditUserForm
        user={data}
        isSelf={authSession.getUser()?.id === data.id}
        onClose={onClose}
        onChanged={onChanged}
      />
    )
  }

  return (
    <Modal width={640} icon="users" title={t.title} onClose={onClose}>
      {loading && (
        <div aria-busy="true" style={{ display: 'grid', gap: 12 }}>
          <span className="odm-sk" style={{ height: 64, display: 'block' }} />
          <span className="odm-sk" style={{ height: 64, display: 'block' }} />
          <span className="odm-sk" style={{ height: 96, display: 'block' }} />
          <span className="odm-visually-hidden">{t.loading}</span>
        </div>
      )}
      {!loading && error !== undefined && (
        <div role="alert" className="adm-alert is-danger">
          {t.loadError}{' '}
          <button type="button" className="odm-btn odm-btn-gh" onClick={reload}>
            {t.retry}
          </button>
        </div>
      )}
    </Modal>
  )
}
