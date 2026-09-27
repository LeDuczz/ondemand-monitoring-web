import { useI18n } from '../../../shared/i18n'
import type { UserRole } from '../../auth/types'
import type { AccountStatus } from '../types/accounts'
import { accountsFiltersMessages } from './AccountsFilters.messages'

export type RoleFilter = UserRole | ''
export type StatusFilter = AccountStatus | ''

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
  const { t } = useI18n(accountsFiltersMessages)

  const ROLE_OPTIONS: Array<{ label: string; value: RoleFilter }> = [
    { label: t.allRoles, value: '' },
    { label: 'CUSTOMER', value: 'CUSTOMER' },
    { label: 'STAFF', value: 'STAFF' },
    { label: 'DRONE_OPERATOR', value: 'DRONE_OPERATOR' },
    { label: 'SYSTEM_OPERATOR', value: 'SYSTEM_OPERATOR' },
    { label: 'ADMIN', value: 'ADMIN' },
    { label: 'AUDITOR', value: 'AUDITOR' },
  ]

  const STATUS_OPTIONS: Array<{ label: string; value: StatusFilter }> = [
    { label: t.allStatuses, value: '' },
    { label: t.active, value: 'ACTIVE' },
    { label: t.locked, value: 'INACTIVE' },
    { label: t.unverified, value: 'PENDING' },
  ]

  return (
    <div className="odm-adm-account-filters">
      <input
        className="odm-inp odm-adm-account-search"
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t.searchPlaceholder}
        aria-label={t.searchAria}
      />
      <select
        className="odm-inp odm-adm-account-select"
        aria-label={t.roleAria}
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
        aria-label={t.statusAria}
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
