import { useI18n } from '../../../../../shared/i18n'
import { BE_USER_ROLES, type ManagedUserRole } from '../../../api/adminUsersApi'
import { roleBadgeMessages } from '../../../components/common/RoleBadge.messages'
import type { AccountsFilterState, StatusFilter } from '../listParams'
import { accountsFiltersMessages } from './AccountsFilters.messages'

export function AccountsFilters({
  value,
  onChange,
}: {
  value: AccountsFilterState
  onChange: (next: AccountsFilterState) => void
}) {
  const { t } = useI18n(accountsFiltersMessages)
  const { t: roles } = useI18n(roleBadgeMessages)

  return (
    <div className="odm-adm-account-filters">
      <input
        className="odm-inp odm-adm-account-search"
        type="text"
        value={value.search}
        onChange={(e) => onChange({ ...value, search: e.target.value })}
        placeholder={t.searchPlaceholder}
        aria-label={t.searchAria}
      />
      <select
        className="odm-inp odm-adm-account-select"
        aria-label={t.roleAria}
        value={value.role}
        onChange={(e) =>
          onChange({ ...value, role: e.target.value as ManagedUserRole | '' })
        }
      >
        <option value="">{t.allRoles}</option>
        {BE_USER_ROLES.map((r) => (
          <option key={r} value={r}>
            {roles.labels[r]}
          </option>
        ))}
      </select>
      <select
        className="odm-inp odm-adm-account-select"
        aria-label={t.statusAria}
        value={value.status}
        onChange={(e) =>
          onChange({ ...value, status: e.target.value as StatusFilter })
        }
      >
        <option value="">{t.allStatuses}</option>
        <option value="active">{t.active}</option>
        <option value="locked">{t.locked}</option>
        <option value="unverified">{t.unverified}</option>
      </select>
    </div>
  )
}
