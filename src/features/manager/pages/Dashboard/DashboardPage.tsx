import { useState } from 'react'
import { StateView } from '../../../../shared/components/odm/StateView'
import { Button, PageHeader } from '../../../../shared/components/ui'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { managerApi } from '../../api/dashboardApi'
import '../../manager.css'
import './dashboard.css'
import { dashboardPageMessages } from './DashboardPage.messages'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { KpiRow } from './components/KpiRow'
import { ActionListCard } from './components/ActionListCard'
import { RecentOrdersCard } from './components/RecentOrdersCard'
import { ActiveMissionsCard, PipelineCard, RecentActivityCard } from './components/SideCards'
import { AnalyticsCharts } from './components/AnalyticsCharts'
import { formatDashboardDate, normalizeDashboard } from './dashboardHelpers'

export function DashboardPage() {
  const { t } = useI18n(dashboardPageMessages)
  const [range, setRange] = useState<'7D' | '30D' | '90D'>('30D')
  const query = useApiQuery((signal) => managerApi.getDashboard(range, signal), [range])

  if (query.loading) return <DashboardSkeleton t={t} />
  if (query.error) {
    return (
      <StateView state="error" title={t.loadError} error={query.error} onRetry={query.reload} />
    )
  }
  if (!query.data) return null

  const data = normalizeDashboard(query.data)
  return (
    <div className="odm-dash">
      <PageHeader
        title={t.title}
        subtitle={`${t.generatedAt}: ${formatDashboardDate(data.generatedAt)}`}
        actions={
          <div className="odm-dash-controls">
            <div className="odm-dash-seg" role="group" aria-label={t.rangeLabel}>
              {(['7D', '30D', '90D'] as const).map((value) => (
                <button key={value} type="button" className={range === value ? 'is-active' : ''}
                  aria-pressed={range === value} onClick={() => setRange(value)}>
                  {t.ranges[value]}
                </button>
              ))}
            </div>
            <Button size="sm" variant="ghost" type="button" onClick={query.reload}>{t.refresh}</Button>
          </div>
        }
      />

      <KpiRow data={data} />

      <div className="odm-dash-grid">
        <div className="odm-dash-col">
          <ActionListCard items={data.actionItems} generatedAt={data.generatedAt} />
          <RecentOrdersCard orders={data.recentOrders} />
        </div>
        <div className="odm-dash-col">
          <ActiveMissionsCard missions={data.activeMissions} />
          <PipelineCard pipeline={data.pricingPipeline} />
          <RecentActivityCard activities={data.recentActivities} />
        </div>
      </div>

      <AnalyticsCharts data={data} />
    </div>
  )
}
