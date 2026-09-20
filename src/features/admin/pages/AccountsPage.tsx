import { useState } from 'react'

import { EmptyState, ErrorState, LoadingState } from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { adminApi } from '../api/adminApi'
import { ACCOUNT_STATUS_META, fmtDateTime, ROLE_LABEL } from '../lib/accountStatus'
import { adminHref } from '../routes'
import type { UserRole } from '../../auth/types'
import type { AccountStatus } from '../types/accounts'

type RoleFilter = UserRole | ''
type StatusFilter = AccountStatus | ''

const ROLE_FILTERS: Array<{ label: string; value: RoleFilter }> = [
  { label: 'Tất cả vai trò', value: '' },
  { label: 'Quản trị', value: 'ADMIN' },
  { label: 'Nhân viên', value: 'STAFF' },
  { label: 'Phi công', value: 'DRONE_OPERATOR' },
  { label: 'Vận hành', value: 'SYSTEM_OPERATOR' },
  { label: 'Khách hàng', value: 'CUSTOMER' },
]

const STATUS_FILTERS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Tất cả trạng thái', value: '' },
  { label: 'Hoạt động', value: 'ACTIVE' },
  { label: 'Chờ xác minh', value: 'PENDING' },
  { label: 'Vô hiệu', value: 'INACTIVE' },
]

export function AccountsPage() {
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')

  const { data, loading, error, reload } = useApiQuery(
    (signal) =>
      adminApi.listAccounts({
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        signal,
      }),
    [roleFilter, statusFilter],
  )

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Quản lý tài khoản</h1>
        <a className="odm-btn odm-btn-p" href={adminHref({ screen: 'createAccount' })}>
          + Tạo tài khoản
        </a>
      </div>

      <div className="odm-adm-filter-row">
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
      <div className="odm-adm-filter-row">
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

      {!loading && (error || !data) && <ErrorState error={error} onRetry={reload} />}

      {!loading && data && data.items.length === 0 && (
        <EmptyState
          title="Không tìm thấy tài khoản"
          description="Thử thay đổi bộ lọc hoặc tạo tài khoản mới."
          action={
            <a className="odm-btn odm-btn-p" href={adminHref({ screen: 'createAccount' })}>
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
          <div
            style={{
              padding: '10px 16px',
              borderBottom: '1px solid var(--bd)',
              fontSize: 12,
              color: 'var(--tx3)',
            }}
          >
            {data.items.length} tài khoản
          </div>
          <table className="odm-adm-table">
            <thead>
              <tr>
                <th>Họ tên</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Trạng thái</th>
                <th>Ngày tạo</th>
                <th>Đăng nhập gần nhất</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((acc) => {
                const statusMeta = ACCOUNT_STATUS_META[acc.status]
                return (
                  <tr key={acc.id}>
                    <td>
                      <a
                        href={adminHref({ screen: 'accountDetail', accountId: acc.id })}
                        style={{ color: 'var(--tx)', textDecoration: 'none', fontWeight: 500 }}
                      >
                        {acc.fullName}
                        {!acc.emailVerified && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              color: 'var(--tx3)',
                              fontStyle: 'italic',
                            }}
                          >
                            (chưa xác minh)
                          </span>
                        )}
                      </a>
                    </td>
                    <td style={{ color: 'var(--tx2)', fontSize: 12 }}>{acc.email}</td>
                    <td>
                      <span className="odm-adm-role">
                        {ROLE_LABEL[acc.role] ?? acc.role}
                      </span>
                    </td>
                    <td>
                      <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx3)' }}>
                      {fmtDateTime(acc.createdAt)}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx3)' }}>
                      {acc.lastLoginAt ? fmtDateTime(acc.lastLoginAt) : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
