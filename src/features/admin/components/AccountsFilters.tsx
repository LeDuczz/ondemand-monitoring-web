import type { UserRole } from '../../auth/types'
import type { AccountStatus } from '../types/accounts'

export type RoleFilter = UserRole | ''
export type StatusFilter = AccountStatus | ''

const ROLE_OPTIONS: Array<{ label: string; value: RoleFilter }> = [
  { label: 'Tất cả vai trò', value: '' },
  { label: 'CUSTOMER', value: 'CUSTOMER' },
  { label: 'STAFF', value: 'STAFF' },
  { label: 'DRONE_OPERATOR', value: 'DRONE_OPERATOR' },
  { label: 'SYSTEM_OPERATOR', value: 'SYSTEM_OPERATOR' },
  { label: 'ADMIN', value: 'ADMIN' },
  { label: 'AUDITOR', value: 'AUDITOR' },
]

const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
  { label: 'Mọi trạng thái', value: '' },
  { label: 'Hoạt động', value: 'ACTIVE' },
  { label: 'Đã khoá', value: 'INACTIVE' },
  { label: 'Chưa xác thực', value: 'PENDING' },
]

export function AccountsFilters({
  query,
  onQueryChange,
  role,
  onRoleChange,
  status,
  onStatusChange,
}: {
  query: string
  onQueryChange: (v: string) => void
  role: RoleFilter
  onRoleChange: (v: RoleFilter) => void
  status: StatusFilter
  onStatusChange: (v: StatusFilter) => void
}) {
  return (
    <div className="odm-adm-account-filters">
      <input
        className="odm-inp odm-adm-account-search"
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="Tìm tên hoặc email..."
        aria-label="Tìm người dùng"
      />
      <select
        className="odm-inp odm-adm-account-select"
        aria-label="Vai trò"
        value={role}
        onChange={(e) => onRoleChange(e.target.value as RoleFilter)}
      >
        {ROLE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <select
        className="odm-inp odm-adm-account-select"
        aria-label="Trạng thái"
        value={status}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
      >
        {STATUS_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
