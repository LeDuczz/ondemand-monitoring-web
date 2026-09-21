import { useState } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { adminApi } from '../api/adminApi'
import {
  ACCOUNT_STATUS_META,
  fmtDate,
  fmtDateTime,
  ROLE_LABEL,
} from '../lib/accountStatus'
import { adminHref } from '../routes'
import { CertExpiryBanner } from '../components/CertExpiryBanner'
import { ChangeRoleDialog } from '../components/ChangeRoleDialog'
import { LockAccountDialog } from '../components/LockAccountDialog'
import { ResetPasswordDialog } from '../components/ResetPasswordDialog'
import type { UserRole } from '../../auth/types'
import type { AccountStatus, AdminAccountItem } from '../types/accounts'

type RoleFilter = UserRole | ''
type StatusFilter = AccountStatus | ''
type DialogState =
  | { type: 'changeRole'; account: AdminAccountItem }
  | { type: 'lock'; account: AdminAccountItem }
  | { type: 'resetPwd'; account: AdminAccountItem }
  | null

const ROLE_FILTERS: Array<{ label: string; value: RoleFilter }> = [
  { label: 'Tất cả vai trò', value: '' },
  { label: 'Khách hàng', value: 'CUSTOMER' },
  { label: 'Nhân viên', value: 'STAFF' },
  { label: 'Phi công', value: 'DRONE_OPERATOR' },
  { label: 'Vận hành', value: 'SYSTEM_OPERATOR' },
  { label: 'Quản trị', value: 'ADMIN' },
  { label: 'Kiểm toán', value: 'AUDITOR' },
]

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Mọi trạng thái', value: '' },
  { label: 'Hoạt động', value: 'ACTIVE' },
  { label: 'Đã khoá', value: 'INACTIVE' },
  { label: 'Chưa xác thực', value: 'PENDING' },
]

export function AccountsPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [dialog, setDialog] = useState<DialogState>(null)

  const { data, loading, error, reload } = useApiQuery(
    (signal) =>
      adminApi.listAccounts({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        signal,
      }),
    [roleFilter, statusFilter],
  )

  function handleDialogSuccess() {
    setDialog(null)
    reload()
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              lineHeight: 1.3,
            }}
          >
            Người dùng
          </h1>
          {data && (
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--tx3)' }}>
              {data.items.length} tài khoản
            </p>
          )}
        </div>
        <a
          className="odm-btn odm-btn-p"
          href={adminHref({ screen: 'createAccount' })}
        >
          + Tạo người dùng nội bộ
        </a>
      </div>

      {data && <CertExpiryBanner accounts={data.items} />}

      <div className="odm-adm-filter-row" style={{ marginBottom: 6 }}>
        {ROLE_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`odm-btn ${roleFilter === f.value ? 'odm-btn-p' : 'odm-btn-gh'}`}
            onClick={() => setRoleFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>
      <div className="odm-adm-filter-row" style={{ marginBottom: 16 }}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`odm-btn ${statusFilter === f.value ? 'odm-btn-p' : 'odm-btn-gh'}`}
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <LoadingState />}

      {!loading && (error || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}

      {!loading && data && data.items.length === 0 && (
        <EmptyState
          title="Không tìm thấy tài khoản"
          description="Thử thay đổi bộ lọc hoặc tạo tài khoản mới."
          action={
            <a
              className="odm-btn odm-btn-p"
              href={adminHref({ screen: 'createAccount' })}
            >
              Tạo tài khoản
            </a>
          }
        />
      )}

      {!loading && data && data.items.length > 0 && (
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Chứng chỉ hết hạn</th>
                <th>Đăng nhập cuối</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((acc) => {
                const statusMeta = ACCOUNT_STATUS_META[acc.status]
                return (
                  <tr key={acc.id}>
                    <td>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <span
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: '50%',
                            background: 'var(--blue-solid)',
                            color: 'var(--inkfg)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 11,
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                          aria-hidden="true"
                        >
                          {acc.fullName
                            .split(' ')
                            .slice(-2)
                            .map((w) => w[0])
                            .join('')
                            .toUpperCase()}
                        </span>
                        <div>
                          <a
                            href={adminHref({
                              screen: 'accountDetail',
                              accountId: acc.id,
                            })}
                            style={{
                              color: 'var(--tx)',
                              textDecoration: 'none',
                              fontWeight: 500,
                              fontSize: 13,
                            }}
                          >
                            {acc.fullName}
                          </a>
                          <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
                            {acc.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: 12 }}>
                        {ROLE_LABEL[acc.role] ?? acc.role}
                      </span>
                    </td>
                    <td>
                      <StatusBadge tone={statusMeta.tone}>
                        {statusMeta.label}
                      </StatusBadge>
                    </td>
                    <td
                      style={{
                        fontSize: 12,
                        color: acc.certExpiry ? 'var(--tx2)' : 'var(--tx3)',
                      }}
                    >
                      {acc.certExpiry ? fmtDate(acc.certExpiry) : '—'}
                    </td>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--tx3)',
                      }}
                    >
                      {acc.lastLoginAt ? fmtDateTime(acc.lastLoginAt) : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button
                          type="button"
                          className="odm-btn odm-btn-gh"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() =>
                            setDialog({ type: 'changeRole', account: acc })
                          }
                          title="Đổi vai trò"
                        >
                          Đổi vai trò
                        </button>
                        <button
                          type="button"
                          className="odm-btn odm-btn-gh"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() =>
                            setDialog({ type: 'lock', account: acc })
                          }
                          title={acc.status === 'INACTIVE' ? 'Mở khoá' : 'Khoá'}
                        >
                          {acc.status === 'INACTIVE' ? 'Mở khoá' : 'Khoá'}
                        </button>
                        <button
                          type="button"
                          className="odm-btn odm-btn-gh"
                          style={{ fontSize: 11, padding: '3px 8px' }}
                          onClick={() =>
                            setDialog({ type: 'resetPwd', account: acc })
                          }
                          title="Reset mật khẩu"
                        >
                          Reset MK
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {dialog?.type === 'changeRole' && (
        <ChangeRoleDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
          onSuccess={handleDialogSuccess}
        />
      )}
      {dialog?.type === 'lock' && (
        <LockAccountDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
          onSuccess={handleDialogSuccess}
        />
      )}
      {dialog?.type === 'resetPwd' && (
        <ResetPasswordDialog
          account={dialog.account}
          onClose={() => setDialog(null)}
          onSuccess={handleDialogSuccess}
        />
      )}
    </div>
  )
}
