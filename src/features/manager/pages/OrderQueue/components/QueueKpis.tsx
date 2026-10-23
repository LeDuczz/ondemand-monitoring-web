import { StatCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { orderQueuePageMessages } from '../OrderQueuePage.messages'

type Props = {
  pending: number
  ready: number
  /** Null while the full order list is still loading or failed to load. */
  needsInfo: number | null
  waitingDeposit: number | null
}

export function QueueKpis({ pending, ready, needsInfo, waitingDeposit }: Props) {
  const { t } = useI18n(orderQueuePageMessages)
  const show = (value: number | null) => (value === null ? '–' : value)
  return (
    <div className="mgr-kpis">
      <StatCard label={t.kpis.pending} value={pending} hint={t.kpis.pendingHint} tone={pending > 0 ? 'warning' : 'default'} />
      <StatCard label={t.kpis.needsInfo} value={show(needsInfo)} hint={t.kpis.needsInfoHint} />
      <StatCard label={t.kpis.waitingDeposit} value={show(waitingDeposit)} hint={t.kpis.waitingDepositHint} />
      <StatCard label={t.kpis.ready} value={ready} hint={t.kpis.readyHint} tone={ready > 0 ? 'success' : 'default'} />
    </div>
  )
}
