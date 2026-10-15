import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../types/planning'
import type { MissionResponse } from '../../types/missions'
import type { OrderDetail } from '../../types/orders'
import type { SafeStop } from '../../types/planning'
import { useI18n } from '../../../../shared/i18n'
import { notEligibleNoticeMessages } from './NotEligibleNotice.messages'

export function NotEligibleNotice({
  orderId,
  query,
  onClose,
  returnLabel,
}: {
  orderId: string
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    stops: (SafeStop | null)[]
  }>
  onClose: () => void
  returnLabel: string
}) {
  const { t } = useI18n(notEligibleNoticeMessages)

  return (
    <section className="odm-or-card odm-or-card-body">
      <p role="alert">{t.nhiemVuChuaDuDieu}</p>
      <a
        className="odm-btn"
        href={`#portal/manager/orders/${encodeURIComponent(orderId)}`}
      >
        {t.openOrderPlan}
      </a>
      <button className="odm-btn" onClick={query.reload}>
        {t.reloadStatus}
      </button>
      <button className="odm-btn" onClick={onClose}>
        {returnLabel}
      </button>
    </section>
  )
}
