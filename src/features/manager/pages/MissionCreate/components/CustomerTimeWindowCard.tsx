import { Card } from '../../../../../shared/components/ui'
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
    <Card title={t.customerTimeWindow}>
      <div className="odm-plan-bigvalue">
        {preferredLabel(brief.preferredDate, brief.preferredTimeName)}
      </div>
      <p className="odm-plan-field-help">{t.customerTimeWindowHint}</p>
    </Card>
  )
}
