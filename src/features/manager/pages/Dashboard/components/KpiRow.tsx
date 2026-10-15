import { StatCard } from '../../../../../shared/components/ui'
import type { StatTone } from '../../../../../shared/components/ui'
import type { ManagerDashboardResponse } from '../../../types/dashboard'
import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { kpiRowMessages } from './KpiRow.messages'

function Kpi({
  label,
  value,
  hint,
  tone,
  href,
}: {
  label: string
  value: string
  hint: string
  tone?: StatTone
  href?: string
}) {
  const card = (
    <StatCard
      label={label}
      value={value}
      hint={hint || undefined}
      tone={tone}
    />
  )
  return href ? (
    <a className="mng-stat-link" href={href}>
      {card}
    </a>
  ) : (
    card
  )
}

export function KpiRow({ data }: { data: ManagerDashboardResponse }) {
  const { t } = useI18n(kpiRowMessages)
  const { kpis } = data
  return (
    <div className="mng-stats">
      <Kpi
        label={t.kpis.pendingOrders}
        value={String(kpis.pendingOrders.count)}
        hint={kpis.pendingOrders.detail}
        tone={kpis.pendingOrders.count > 0 ? 'warning' : 'default'}
        href={managerHref({ screen: 'orderQueue' })}
      />
      <Kpi
        label={t.kpis.missionsToday}
        value={String(kpis.missionsToday.count)}
        hint={kpis.missionsToday.detail}
        href={managerHref({ screen: 'missions' })}
      />
      <Kpi
        label={t.kpis.missionsInFlight}
        value={String(kpis.missionsInFlight.count)}
        hint={kpis.missionsInFlight.detail}
        href={managerHref({ screen: 'live' })}
      />
      <Kpi
        label={t.kpis.dronesReady}
        value={`${kpis.dronesReady.ready}/${kpis.dronesReady.total}`}
        hint={kpis.dronesReady.detail}
        tone="success"
        href={managerHref({ screen: 'drones' })}
      />
      <Kpi
        label={t.kpis.actionItems}
        value={String(kpis.actionItems.count)}
        hint={kpis.actionItems.detail}
        tone={kpis.actionItems.count > 0 ? 'warning' : 'default'}
      />
    </div>
  )
}
