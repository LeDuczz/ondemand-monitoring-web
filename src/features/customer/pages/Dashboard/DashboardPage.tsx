import { ErrorState, LoadingState } from '../../../../shared/components/odm/StateView'
import { PageHeader } from '../../../../shared/components/ui'
import { useI18n } from '../../../../shared/i18n'
import { customerHref } from '../../routes'
import { DashboardStats } from './components/DashboardStats'
import { RecentMissionsCard } from './components/RecentMissionsCard'
import { RecentOrdersCard } from './components/RecentOrdersCard'
import { StatusBreakdown } from './components/StatusBreakdown'
import './Dashboard.css'
import { dashboardPageMessages } from './DashboardPage.messages'
import { useDashboardData } from './hooks/useDashboardData'

/** Customer overview computed client-side from the orders and mission history. */
export function DashboardPage() {
  const { t } = useI18n(dashboardPageMessages)
  const { orders, missions, stats, recent } = useDashboardData()

  return (
    <div className="dash-page">
      <PageHeader
        title={t.title}
        subtitle={t.subtitle}
        actions={
          <a className="odm-btn odm-btn-p" href={customerHref({ screen: 'createOrder' })}>
            {t.createOrder}
          </a>
        }
      />

      {orders.loading && !orders.data && <LoadingState />}
      {!orders.data && !orders.loading && (
        <ErrorState title={t.ordersErrorTitle} error={orders.error} onRetry={orders.reload} />
      )}
      {orders.data && (
        <>
          <DashboardStats stats={stats} />
          <div className="dash-grid">
            <RecentOrdersCard orders={recent} />
            <StatusBreakdown stats={stats} />
          </div>
        </>
      )}

      <RecentMissionsCard
        missions={missions.data}
        loading={missions.loading}
        error={missions.error}
        onRetry={missions.reload}
      />
    </div>
  )
}
