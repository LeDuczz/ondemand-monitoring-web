import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { adminApi } from '../../api/adminApi'
import { PageHeader } from '../../components/common/PageHeader'
import { adminHref } from '../../routes'
import { fetchAccountStats } from './accountStats'
import { adminDashboardPageMessages } from './AdminDashboardPage.messages'
import { AccountStatCards } from './components/AccountStatCards'
import { RecentAccountsCard } from './components/RecentAccountsCard'
import { RoleBreakdown } from './components/RoleBreakdown'

export function AdminDashboardPage() {
  const { t } = useI18n(adminDashboardPageMessages)
  const stats = useApiQuery((signal) => fetchAccountStats(signal), [])
  const mock = useApiQuery((signal) => adminApi.getDashboard(signal), [])

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

      {stats.error ? (
        <div className="adm-list-sub" role="alert">
          {t.statsError}{' '}
          <button type="button" className="odm-btn" onClick={stats.reload}>
            {t.retry}
          </button>
        </div>
      ) : null}

      <AccountStatCards stats={stats.data} />

      <div className="adm-grid-wide">
        <RoleBreakdown stats={stats.data} />
        {mock.data ? (
          <RecentAccountsCard accounts={mock.data.recentAccounts} />
        ) : null}
      </div>
    </div>
  )
}
