import { useState } from 'react'

import { StateView } from '../../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { managerApi } from '../../api/dashboardApi'
import { dashboardPageMessages } from './DashboardPage.messages'
import type { ActionItem } from '../../types/dashboard'
import '../../manager.css'
import { DashboardHeader } from './components/DashboardHeader'
import { DashboardSkeleton } from './components/DashboardSkeleton'
import { KpiRow } from './components/KpiRow'
import { DashboardCharts } from './components/DashboardCharts'
import { ActionListCard } from './components/ActionListCard'
import { FlyingMissionCard } from './components/FlyingMissionCard'

type ActionItemType = ActionItem['type']

// Label for each action-item-type filter chip above "Cần xử lý ngay".
// [TK MNG-01]'s own prototype ties the KPI cards themselves to this filter
// (onClick sets local demo state), but here the KPI cards instead navigate
// to their related queue screen (Đơn chờ duyệt -> orders queue, Mission hôm
// nay -> missions, Mission đang bay -> live, Drone sẵn sàng -> drones, Việc
// cần xử lý -> media) — a real shortcut instead of a prototype-only local
// toggle. The list keeps its own small filter-chip row instead, matching
// the design's "filter chip + Xoá lọc" affordance without depending on KPI
// clicks (documented in evd/P3-manager-dashboard.md).

export function DashboardPage() {
  const { t } = useI18n(dashboardPageMessages)
  const [now] = useState(() => new Date())
  const [filter, setFilter] = useState<ActionItemType | 'all'>('all')
  const query = useApiQuery((signal) => managerApi.getDashboard(signal), [])

  if (query.loading) return <DashboardSkeleton />

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

  const data = query.data
  if (!data) return null

  const visibleItems =
    filter === 'all'
      ? data.actionItems
      : data.actionItems.filter((item) => item.type === filter)

  const presentTypes = Array.from(
    new Set(data.actionItems.map((item) => item.type)),
  )

  return (
    <div>
      <DashboardHeader now={now} />

      <KpiRow data={data} />

      <DashboardCharts data={data} />

      <div className="mng-dash-grid">
        <ActionListCard
          filter={filter}
          setFilter={setFilter}
          presentTypes={presentTypes}
          data={data}
          visibleItems={visibleItems}
          now={now}
        />

        <FlyingMissionCard data={data} now={now} />
      </div>
    </div>
  )
}
