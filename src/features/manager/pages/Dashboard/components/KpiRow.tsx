import type { ManagerDashboardData } from '../../../types/dashboard'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { KpiCard } from './KpiCard'

export function KpiRow({ data }: { data: ManagerDashboardData }) {
  const { t, locale } = useI18n(dashboardPageMessages)
  const k = t.kpi
  const vnd = new Intl.NumberFormat(locale, {
    style: 'currency', currency: 'VND', notation: 'compact', maximumFractionDigits: 1,
  })
  const s = data.summary
  return (
    <div className="odm-mgr-kpi-row ui-stagger">
      <KpiCard label={k.totalOrders} value={s.totalOrders} detail={k.totalOrdersDetail} href={managerHref({ screen: 'orderQueue' })} />
      <KpiCard label={k.checklistPending} value={s.pendingAdditionalChecklistCount} detail={k.checklistPendingDetail} href={managerHref({ screen: 'orderQueue' })} tone="warning" />
      <KpiCard label={k.quoteValue} value={vnd.format(s.totalQuoteValue)} detail={k.quoteValueDetail} href={managerHref({ screen: 'orderQueue' })} />
      <KpiCard label={k.waitingDeposit} value={s.waitingDepositCount} detail={k.waitingDepositDetail} href={managerHref({ screen: 'orderQueue' })} tone="warning" />
      <KpiCard label={k.activeMissions} value={s.activeMissionCount} detail={k.activeMissionsDetail} href={managerHref({ screen: 'missions' })} />
      <KpiCard label={k.attention} value={s.attentionRequiredCount} detail={k.attentionDetail} href={managerHref({ screen: 'missions' })} tone="danger" />
    </div>
  )
}
