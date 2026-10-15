import { OrderIcon } from '../../../components/common/OrderIcon'
import { preferredLabel } from '../../../lib/viLabels'
import type { OrderMissionBrief } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { customerTimeWindowCardMessages } from './CustomerTimeWindowCard.messages'

export function CustomerTimeWindowCard({
  brief,
}: {
  brief: OrderMissionBrief
}) {
  const { t } = useI18n(customerTimeWindowCardMessages)
  return (
    <section className="odm-or-card">
      <header className="odm-or-card-head">
        <span className="odm-or-card-title">
          <OrderIcon name="calendar" size={18} />
          {t.customerTimeWindow}
        </span>
      </header>
      <div className="odm-or-card-body">
        <div className="odm-or-bigvalue">
          {preferredLabel(brief.preferredDate, brief.preferredTimeName)}
        </div>
        <p className="odm-or-muted">{t.customerTimeWindowHint}</p>
      </div>
    </section>
  )
}
