import type { UseApiQueryState } from '../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../types/planning'
import type { MissionResponse } from '../../types/missions'
import type { OrderDetail } from '../../types/orders'
import type { SafeStop } from '../../types/planning'
import { useI18n } from '../../../../shared/i18n'
import { missionLoadFailedNoticeMessages } from './MissionLoadFailedNotice.messages'

export function MissionLoadFailedNotice({
  query,
  onClose,
  returnLabel,
}: {
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
    stops: (SafeStop | null)[]
  }>
  onClose: () => void
  returnLabel: string
}) {
  const { t } = useI18n(missionLoadFailedNoticeMessages)

  return (
    <section className="odm-or-card odm-or-card-body">
      <p role="alert">{t.khongTheTaiDungNhiem}</p>
      <button className="odm-btn" onClick={query.reload}>
        {t.retry}
      </button>
      <button className="odm-btn" onClick={onClose}>
        {returnLabel}
      </button>
    </section>
  )
}
