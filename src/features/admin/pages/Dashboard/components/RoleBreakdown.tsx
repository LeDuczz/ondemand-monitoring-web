import { useI18n } from '../../../../../shared/i18n'
import { BE_USER_ROLES } from '../../../api/adminUsersApi'
import { Card } from '../../../components/common/Card'
import { RoleBadge } from '../../../components/common/RoleBadge'
import type { AccountStats } from '../accountStats'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'

export function RoleBreakdown({ stats }: { stats: AccountStats | null | undefined }) {
  const { t } = useI18n(adminDashboardPageMessages)
  return (
    <Card title={t.byRole}>
      <div className="adm-bar-list">
        {BE_USER_ROLES.map((role) => {
          const count = stats?.byRole[role]
          const pct =
            stats && stats.total > 0 && count !== undefined
              ? Math.round((count / stats.total) * 100)
              : 0
          return (
            <div key={role}>
              <div className="adm-bar-head">
                <RoleBadge role={role} />
                <strong className="adm-mono" data-testid={`dash-role-${role}`}>
                  {count ?? <span className="adm-skeleton" />}
                </strong>
              </div>
              <div className="adm-bar">
                <div
                  className="adm-bar-fill"
                  style={{
                    width: `${pct}%`,
                    background: `var(--adm-role-${roleToken(role)}-fg)`,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function roleToken(role: string): string {
  switch (role) {
    case 'SYSTEM_OPERATOR':
      return 'sysop'
    case 'DRONE_OPERATOR':
      return 'drone'
    default:
      return role.toLowerCase()
  }
}
