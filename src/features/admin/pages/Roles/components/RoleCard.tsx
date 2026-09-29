import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import {
  adminUsersApi,
  type ManagedUserRole,
} from '../../../api/adminUsersApi'
import { Card } from '../../../components/common/Card'
import { RoleBadge } from '../../../components/common/RoleBadge'
import { rolesPageMessages } from '../RolesPage.messages'

/** One read-only role card with its live user count from the BE. */
export function RoleCard({ role }: { role: ManagedUserRole }) {
  const { t } = useI18n(rolesPageMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminUsersApi.listUsers({ role, size: 1, signal }),
    [role],
  )

  return (
    <Card title={<RoleBadge role={role} />}>
      <p className="adm-role-desc">{t.descriptions[role]}</p>
      {loading ? (
        <span
          className="adm-skeleton"
          data-testid={`role-skeleton-${role}`}
          aria-busy="true"
        />
      ) : error || !data ? (
        <div>
          <span className="adm-list-sub">{t.loadError}</span>{' '}
          <button type="button" className="odm-btn" onClick={reload}>
            {t.retry}
          </button>
        </div>
      ) : (
        <div>
          <span className="adm-role-count" data-testid={`role-count-${role}`}>
            {data.totalItems}
          </span>{' '}
          <span className="adm-list-sub">{t.users}</span>
        </div>
      )}
    </Card>
  )
}
