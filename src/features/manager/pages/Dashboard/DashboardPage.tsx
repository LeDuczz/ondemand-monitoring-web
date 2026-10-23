import { useState } from 'react'
import { StateView } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { managerApi } from '../../api/dashboardApi'
import '../../manager.css'
import { dashboardPageMessages } from './DashboardPage.messages'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { KpiRow } from './components/KpiRow'
import { ActionListCard } from './components/ActionListCard'
import { OperationalSections } from './components/OperationalSections'
import { AnalyticsCharts } from './components/AnalyticsCharts'
import { formatDashboardDate, normalizeDashboard } from './dashboardHelpers'
import { Button } from '../../../../shared/components/ui'

export function DashboardPage() {
  const { t } = useI18n(dashboardPageMessages)
  const [range, setRange] = useState<'7D' | '30D' | '90D'>('30D')
  const query = useApiQuery((signal) => managerApi.getDashboard(range, signal), [range])

  if (query.loading) return <DashboardSkeleton t={t} />
  if (query.error) {
    return (
      <StateView
        state="error"
        title={t.loadError}
        error={query.error}
        onRetry={query.reload}
      />
    )
  }
  if (!query.data) return null

  const data = normalizeDashboard(query.data)
  return (
    <div className="odm-mgr-dash">
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          <span className="odm-visually-hidden">
            {t.opsDashboard}
          </span>
          <p className="odm-mgr-dash-subtitle">{t.subtitle}</p>
          <div className="odm-mgr-dash-date">
            {t.lastUpdated}: {formatDashboardDate(data.generatedAt)}
          </div>
        </div>
        <div className="odm-mgr-dashboard-controls">
          <div className="odm-mgr-range" role="group" aria-label={t.rangeLabel}>
            {(['7D', '30D', '90D'] as const).map((value) => (
              <button key={value} type="button" className={range === value ? 'is-active' : ''}
                aria-pressed={range === value} onClick={() => setRange(value)}>
                {t.ranges[value]}
              </button>
            ))}
          </div>
          <Button type="button" onClick={query.reload}>{t.refresh}</Button>
        </div>
      </div>

      <KpiRow data={data} />
      <AnalyticsCharts data={data} />
      <ActionListCard items={data.actionItems} />
      <OperationalSections data={data} />
    </div>
  )
}
