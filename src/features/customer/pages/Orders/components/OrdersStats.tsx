import { StatCard } from '../../../../../shared/components/ui'
import { useI18n, useLanguage } from '../../../../../shared/i18n'
import { getOrderStatusMeta } from '../../../lib/orderStatus'
import type { OrderStats } from '../../../lib/orders/types'
import { ordersStatsMessages } from './OrdersStats.messages'

export function OrdersStats({ stats }: { stats: OrderStats }) {
  const { t } = useI18n(ordersStatsMessages)
  const { lang } = useLanguage()
  const label = (status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') => getOrderStatusMeta(status, lang).label
  return (
    <div className="ord-stats">
      <StatCard label={t.total} value={stats.total} />
      <StatCard label={label('PENDING')} value={stats.pending} tone={stats.pending > 0 ? 'warning' : 'default'} />
      <StatCard label={label('IN_PROGRESS')} value={stats.inProgress} />
      <StatCard label={label('COMPLETED')} value={stats.completed} tone={stats.completed > 0 ? 'success' : 'default'} />
    </div>
  )
}
