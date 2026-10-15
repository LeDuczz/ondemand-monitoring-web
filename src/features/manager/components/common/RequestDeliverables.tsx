import { FactList } from './FactList'
import {
  addOnItems,
  deliverableSummary,
  requirementItems,
} from './requestDetailHelpers'
import type { OrderDetail } from '../../types/orders'
import { useI18n } from '../../../../shared/i18n'
import { requestDeliverablesMessages } from './RequestDeliverables.messages'

export function RequestDeliverables({ order }: { order: OrderDetail }) {
  const { t } = useI18n(requestDeliverablesMessages)

  return (
    <>
      {order.deliverables?.map((deliverable, index) => {
        const items = requirementItems(deliverable.requirement)
        const summary = deliverableSummary(
          deliverable.requirement,
          deliverable.deliverableTypeName,
        )
        const addOns = addOnItems(deliverable.requirement)
        return (
          <div
            key={deliverable.id || `${deliverable.deliverableTypeId}-${index}`}
            className="odm-or-req-deliverable"
          >
            <div className="odm-or-req-deliverable-head">
              <strong>
                {deliverable.deliverableTypeName || `${t.mediaN(index + 1)}`}
              </strong>
              {summary.length > 0 ? (
                <span className="odm-or-req-summary">
                  {summary.join(' · ')}
                </span>
              ) : null}
            </div>
            {addOns.length > 0 ? (
              <div className="odm-or-addon-list">
                <span>{t.additionalRequirements}</span>
                {addOns.map((item) => (
                  <p key={item}>{item}</p>
                ))}
              </div>
            ) : null}
            {items.length > 0 ? <FactList items={items} /> : null}
            {summary.length === 0 &&
            addOns.length === 0 &&
            items.length === 0 ? (
              <p className="odm-or-detail-note">{t.noData}</p>
            ) : null}
          </div>
        )
      })}
    </>
  )
}
