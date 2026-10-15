import { Card } from '../../../../../shared/components/ui'
import type { OrderDetail } from '../../../types/orders'
import './OrderChecklistCard.css'
import { useI18n } from '../../../../../shared/i18n'
import { orderChecklistCardMessages } from './OrderChecklistCard.messages'

export function OrderChecklistCard({ order }: { order: OrderDetail }) {
  const { t } = useI18n(orderChecklistCardMessages)

  const items = [...(order.checklistItems ?? [])].sort(
    (a, b) => a.displayOrder - b.displayOrder || a.id.localeCompare(b.id),
  )
  return (
    <Card title={t.monitoringRequirements}>
      <p className="odm-or-empty odm-or-checklist-hint">
        {t.requirementsHistory}
      </p>
      {items.length ? (
        <ol className="odm-or-checklist-list">
          {items.map((item) => (
            <li key={item.id}>
              <p className="odm-or-checklist-content">{item.content}</p>
              <span className="odm-or-checklist-source">
                {item.sourceType === 'CUSTOMER_CUSTOM'
                  ? t.customerRequirement
                  : t.serviceRequirement}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="odm-or-empty">
          {order.checklistSnapshotAt
            ? t.requirementsEmpty
            : t.requirementsLegacy}
        </p>
      )}
    </Card>
  )
}
