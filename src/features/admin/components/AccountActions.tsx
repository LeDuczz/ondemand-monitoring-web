import { Icon } from '../../../shared/components/Icon'
import type { AdminAccountItem } from '../types/accounts'

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
  return (
    <div className="odm-adm-account-actions">
      <button
        type="button"
        className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
        onClick={onChangeRole}
        aria-label="Đổi vai trò"
        title="Đổi vai trò"
      >
        <Icon name="shield" width={15} height={15} />
      </button>
      <button
        type="button"
        className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
        onClick={onLock}
        aria-label={account.status === 'INACTIVE' ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
        title={account.status === 'INACTIVE' ? 'Mở khoá tài khoản' : 'Khoá tài khoản'}
      >
        <Icon name="lock" width={15} height={15} />
      </button>
      <button
        type="button"
        className="odm-btn odm-btn-gh odm-btn-sm odm-btn-ic1"
        onClick={onResetPassword}
        aria-label="Reset mật khẩu"
        title="Reset mật khẩu"
      >
        <Icon name="key" width={15} height={15} />
      </button>
    </div>
  )
}
