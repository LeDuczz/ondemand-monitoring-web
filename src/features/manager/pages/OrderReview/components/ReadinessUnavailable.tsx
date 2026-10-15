import { OrderIcon } from '../../../components/common/OrderIcon'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { OrderReadiness } from '../../../types/readiness'
import { useI18n } from '../../../../../shared/i18n'
import { readinessUnavailableMessages } from './ReadinessUnavailable.messages'

export function ReadinessUnavailable({
  query,
}: {
  query: UseApiQueryState<OrderReadiness>
}) {
  const { t } = useI18n(readinessUnavailableMessages)

  return (
    <section
      className="odm-or-card odm-or-readiness"
      aria-label={t.approvalConditions}
    >
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="check" size={18} />
          {t.approvalConditions}
        </span>
      </header>
      <div className="odm-or-card-body odm-or-empty">
        {query.loading
          ? t.checkingApprovalConditions
          : t.couldNotLoadTheApproval}
      </div>
    </section>
  )
}
