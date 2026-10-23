import type { ReactNode } from 'react'

import { StatCard, type StatTone } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref, type ManagerRoute } from '../../../routes'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'

function KpiLink({ route, children }: { route: ManagerRoute; children: ReactNode }) {
  return <a className="odm-dash-kpi" href={managerHref(route)}>{children}</a>
}

export function KpiRow({ data }: { data: ManagerDashboardData }) {
  const { t } = useI18n(dashboardPageMessages)
  const k = t.kpi
  const s = data.summary
  const p = data.pricingPipeline
  const completed = data.missionTrend.reduce((sum, point) => sum + point.completed, 0)
  const failed = data.missionTrend.reduce((sum, point) => sum + point.failed, 0)
  const queue: ManagerRoute = { screen: 'orderQueue' }
  const missions: ManagerRoute = { screen: 'missions' }
  const attentionTone: StatTone = s.attentionRequiredCount > 0 ? 'warning' : 'default'
  return (
    <div className="odm-dash-kpis ui-stagger">
      <KpiLink route={queue}>
        <StatCard label={k.pendingReview} value={s.pendingOrderCount} tone={s.pendingOrderCount > 0 ? 'warning' : 'default'} />
      </KpiLink>
      <KpiLink route={queue}>
        <StatCard label={k.waitingQuote} value={p.pricingReviewCount + p.quoteReadyCount} />
      </KpiLink>
      <KpiLink route={queue}>
        <StatCard label={k.waitingDeposit} value={s.waitingDepositCount}
          hint={p.depositPaidCount > 0 ? k.waitingDepositHint(p.depositPaidCount) : undefined} />
      </KpiLink>
      <KpiLink route={missions}>
        <StatCard label={k.activeMissions} value={s.activeMissionCount} tone={attentionTone}
          hint={s.attentionRequiredCount > 0 ? k.attentionHint(s.attentionRequiredCount) : undefined} />
      </KpiLink>
      <KpiLink route={missions}>
        <StatCard label={k.completed} value={completed} tone="success"
          hint={failed > 0 ? k.completedHint(failed) : undefined} />
      </KpiLink>
    </div>
  )
}
