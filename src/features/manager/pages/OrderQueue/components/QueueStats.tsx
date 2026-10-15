import { StatCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { isOverdue } from '../../../lib/queue'
import type { OrderCreateResponse } from '../../../types/orders'
import { isScheduledSoon } from '../queueHelpers'
import { queueStatsMessages } from './QueueStats.messages'

/** KPI strip computed from the already-loaded queue (no extra API call). */
export function QueueStats({
  data,
  now,
}: {
  data: OrderCreateResponse[]
  now: Date
}) {
  const { t } = useI18n(queueStatsMessages)
  const overdue = data.filter((row) => isOverdue(now, row)).length
  const soon = data.filter((row) => isScheduledSoon(now, row)).length
  return (
    <div className="mng-stats">
      <StatCard label={t.pending} value={data.length} />
      <StatCard
        label={t.overdue}
        value={overdue}
        tone={overdue > 0 ? 'danger' : 'default'}
      />
      <StatCard
        label={t.soon}
        value={soon}
        tone={soon > 0 ? 'warning' : 'default'}
      />
    </div>
  )
}
