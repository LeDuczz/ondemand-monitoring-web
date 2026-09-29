import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderDetailView } from '../../../lib/orders/types'
import { orderDeliverablesMessages } from './DeliverablesCard.messages'

export function DeliverablesCard({ order }: { order: OrderDetailView }) {
  const { t } = useI18n(orderDeliverablesMessages)

  return (
    <Card title={t.title}>
      {order.deliverables.length === 0 ? (
        <p className="od-hint">{t.empty}</p>
      ) : (
        <ul className="od-deliverables">
          {order.deliverables.map((item) => (
            <li key={item.id}>
              <div className="od-deliverable-name">{item.name}</div>
              <dl className="od-req">
                {item.format && (
                  <div>
                    <dt>{t.format}</dt>
                    <dd>{item.format}</dd>
                  </div>
                )}
                {item.requirements.map(({ key, value }) => (
                  <div key={key}>
                    <dt>{t.keys[key] ?? key}</dt>
                    <dd>{key === 'mediaType' ? (t.mediaTypes[value] ?? value) : value}</dd>
                  </div>
                ))}
              </dl>
              {item.aiAnalysisRequested && <p className="od-hint">{t.aiAnalysis}</p>}
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
