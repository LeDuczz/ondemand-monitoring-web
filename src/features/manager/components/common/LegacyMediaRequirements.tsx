import { humanizeMediaRequirement } from './format'
import type { OrderDetail } from '../../types/orders'
import { useI18n } from '../../../../shared/i18n'
import { legacyMediaRequirementsMessages } from './LegacyMediaRequirements.messages'

export function LegacyMediaRequirements({ order }: { order: OrderDetail }) {
  const { t } = useI18n(legacyMediaRequirementsMessages)

  return !order.deliverables?.length && order.mediaRequirements?.length ? (
    <div className="odm-or-req-deliverables">
      {order.mediaRequirements.map((requirement, index) => (
        <p key={index}>{humanizeMediaRequirement(requirement.label, t)}</p>
      ))}
    </div>
  ) : null
}
