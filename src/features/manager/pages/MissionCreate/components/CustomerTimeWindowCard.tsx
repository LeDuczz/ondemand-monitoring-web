import { Card } from '../../../../../shared/components/ui'
import { preferredRangeLabel } from '../../../lib/viLabels'
import type { OrderMissionBrief } from '../../../types/orders'
import { useI18n } from '../../../../../shared/i18n'
import { timePart } from '../createMissionHelpers'
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
        {preferredRangeLabel(
          brief.preferredDateFrom || brief.preferredDate,
          brief.preferredDateTo,
          brief.preferredTimeName,
        )}
        {timePart(brief.preferredDateFrom)
          ? ` · ${timePart(brief.preferredDateFrom)}${timePart(brief.preferredDateTo) ? `–${timePart(brief.preferredDateTo)}` : ''}`
          : ''}
      </div>
      <p className="odm-plan-field-help">{t.customerTimeWindowHint}</p>
    </Card>
  )
}
