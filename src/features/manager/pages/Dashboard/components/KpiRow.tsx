import type { ManagerDashboardResponse } from '../../../types/dashboard'
import { KpiCard } from './KpiCard'
import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { kpiRowMessages } from './KpiRow.messages'

export function KpiRow({ data }: { data: ManagerDashboardResponse }) {
  const { t } = useI18n(kpiRowMessages)
  return (
    <div className="odm-mgr-kpi-row">
      <KpiCard
        label={t.kpis.pendingOrders}
        value={String(data.kpis.pendingOrders.count)}
        detail={data.kpis.pendingOrders.detail}
        href={managerHref({ screen: 'orderQueue' })}
      />
      <KpiCard
        label={t.kpis.missionsToday}
        value={String(data.kpis.missionsToday.count)}
        detail={data.kpis.missionsToday.detail}
        href={managerHref({ screen: 'missions' })}
      />
      <KpiCard
        label={t.kpis.missionsInFlight}
        value={String(data.kpis.missionsInFlight.count)}
        detail={data.kpis.missionsInFlight.detail}
        href={managerHref({ screen: 'live' })}
      />
      <KpiCard
        label={t.kpis.dronesReady}
        value={`${data.kpis.dronesReady.ready}/${data.kpis.dronesReady.total}`}
        detail={data.kpis.dronesReady.detail}
        href={managerHref({ screen: 'drones' })}
      />
      <KpiCard
        label={t.kpis.actionItems}
        value={String(data.kpis.actionItems.count)}
        detail={data.kpis.actionItems.detail}
      />
    </div>
  )
}
