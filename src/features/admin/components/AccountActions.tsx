import { Icon } from '../../../shared/components/Icon'
import { useI18n } from '../../../shared/i18n'
import type { AdminAccountItem } from '../types/accounts'
import { accountActionsMessages } from './AccountActions.messages'

export function AccountActions({
  account,
  onChangeRole,
  onLock,
  onResetPassword,
}: {
  account: AdminAccountItem
  onChangeRole: () => void
  onLock: () => void
  onResetPassword: () => void
}) {
  const { t } = useI18n(accountActionsMessages)
  const lockLabel = account.status === 'INACTIVE' ? t.unlock : t.lock

  return (
    <div className="odm-adm-account-actions">
      <button
        type="button"
        className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
        onClick={onChangeRole}
        aria-label={t.changeRole}
        title={t.changeRole}
      >
        <Icon name="shield" width={15} height={15} />
      </button>
      <button
        type="button"
        className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
        onClick={onLock}
        aria-label={lockLabel}
        title={lockLabel}
      >
        <Icon name="lock" width={15} height={15} />
      </button>
      <button
        type="button"
        className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
        onClick={onResetPassword}
        aria-label={t.resetPassword}
        title={t.resetPassword}
      >
        <Icon name="key" width={15} height={15} />
      </button>
    </div>
  )
}
