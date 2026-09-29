import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import type { AdminAccountItem } from '../../../types/accounts'
import { accountActionsMessages } from './AccountActions.messages'

export function AccountActions({
  account,
  onEdit,
  onLock,
  onResetPassword,
}: {
  account: AdminAccountItem
  onEdit: () => void
  onLock: () => void
  onResetPassword: () => void
}) {
  const { t } = useI18n(accountActionsMessages)
  const locked = account.status === 'INACTIVE'
  const lockLabel = locked ? t.unlock : t.lock

  return (
    <div className="odm-adm-account-actions">
      <button
        type="button"
        className="adm-action-btn"
        onClick={onEdit}
        aria-label={t.edit}
        title={t.edit}
      >
        <Icon name="eye" width={16} height={16} />
      </button>
      <button
        type="button"
        className={`adm-action-btn ${locked ? 'is-success' : 'is-danger'}`}
        onClick={onLock}
        aria-label={lockLabel}
        title={lockLabel}
      >
        <Icon name="lock" width={16} height={16} />
      </button>
      <button
        type="button"
        className="adm-action-btn is-warning"
        onClick={onResetPassword}
        aria-label={t.resetPassword}
        title={t.resetPassword}
      >
        <Icon name="key" width={16} height={16} />
      </button>
    </div>
  )
}
