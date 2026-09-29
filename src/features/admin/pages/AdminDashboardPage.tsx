import {
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { adminApi } from '../api/adminApi'
import {
  getAccountStatusMeta,
  fmtDate,
  getRoleLabel,
} from '../lib/accountStatus'
import { Card } from '../components/common/Card'
import { PageHeader } from '../components/common/PageHeader'
import { StatCard } from '../components/common/StatCard'
import {
  StatusBadge,
  toAdminTone,
} from '../components/common/StatusBadge'
import { adminHref } from '../routes'
import { adminDashboardPageMessages } from './AdminDashboardPage.messages'

export function AdminDashboardPage() {
  const { t, lang } = useI18n(adminDashboardPageMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => adminApi.getDashboard(signal),
    [],
  )

  if (loading) return <LoadingState />
  if (error || !data) return <ErrorState error={error} onRetry={reload} />

  const roleOrder = [
    'ADMIN',
    'STAFF',
    'DRONE_OPERATOR',
    'SYSTEM_OPERATOR',
    'CUSTOMER',
  ]

  return (
    <div>
      <PageHeader
        title={t.title}
        actions={
          <a
            className="odm-btn odm-btn-p"
            href={adminHref({ screen: 'createAccount' })}
          >
            {t.createAccount}
          </a>
        }
      />

      <div className="adm-grid">
        <StatCard
          label={t.totalAccounts}
          value={data.totalAccounts}
          hint={t.systemWide}
        />
        <StatCard
          label={t.active}
          value={data.activeAccounts}
          hint={t.accountsUnit}
          tone="success"
        />
        <StatCard
          label={t.pendingVerification}
          value={data.pendingAccounts}
          hint={t.accountsUnit}
          tone={data.pendingAccounts > 0 ? 'warning' : 'default'}
        />
        <StatCard
          label={t.inactive}
          value={data.inactiveAccounts}
          hint={t.accountsUnit}
        />
      </div>

      <div className="adm-grid-wide">
        <Card title={t.byRole}>
          <div className="adm-bar-list">
            {roleOrder
              .filter((r) => data.byRole[r])
              .map((r) => {
                const count = data.byRole[r] ?? 0
                const pct = Math.round((count / data.totalAccounts) * 100)
                return (
                  <div key={r}>
                    <div className="adm-bar-head">
                      <span>
                        {getRoleLabel(
                          r as Parameters<typeof getRoleLabel>[0],
                          lang,
                        ) ?? r}
                      </span>
                      <span className="adm-mono">{count}</span>
                    </div>
                    <div className="adm-bar">
                      <div
                        className="adm-bar-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        </Card>

        <Card
          title={t.latestAccounts}
          actions={
            <a href={adminHref({ screen: 'accounts' })}>{t.viewAll}</a>
          }
        >
          <div className="adm-list">
            {data.recentAccounts.map((acc) => {
              const meta = getAccountStatusMeta(acc.status, lang)
              return (
                <div key={acc.id} className="adm-list-row">
                  <div className="odm-adm-avatar" aria-hidden="true">
                    {(acc.fullName[0] ?? '?').toUpperCase()}
                  </div>
                  <div className="adm-list-main">
                    <a
                      className="adm-list-link"
                      href={adminHref({
                        screen: 'accountDetail',
                        accountId: acc.id,
                      })}
                    >
                      {acc.fullName}
                    </a>
                    <div className="adm-list-sub">
                      {fmtDate(acc.createdAt, lang)}
                    </div>
                  </div>
                  <StatusBadge tone={toAdminTone(meta.tone)}>
                    {meta.label}
                  </StatusBadge>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}
