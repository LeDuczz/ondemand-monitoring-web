import { Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { OrderDetailView } from '../../../lib/orders/types'
import { localizeDeliverableName } from '../../../lib/i18n/catalogNames'
import { OrderIcon, type OrderIconName } from '../../../../manager/components/orderReview/OrderIcon'
import { CardTitle } from './CardTitle'
import { orderDeliverablesMessages } from './DeliverablesCard.messages'

const REQ_ICONS: Record<string, OrderIconName> = {
  mediaType: 'stack',
  quantity: 'stack',
  resolution: 'resolution',
  radiusM: 'target',
  estimatedAreaHa: 'area',
}

export function DeliverablesCard({ order }: { order: OrderDetailView }) {
  const { t, lang } = useI18n(orderDeliverablesMessages)

  return (
    <Card title={<CardTitle icon="media">{t.title}</CardTitle>}>
      {order.deliverables.length === 0 ? (
        <p className="od-hint">{t.empty}</p>
      ) : (
        <ul className="od-deliverables">
          {order.deliverables.map((item) => (
            <li key={item.id}>
              <div className="od-deliverable-name">{localizeDeliverableName(item.name, lang)}</div>
              <dl className="od-req">
                {item.format && (
                  <div>
                    <dt>
                      <OrderIcon name="file" size={14} />
                      {t.format}
                    </dt>
                    <dd>{item.format}</dd>
                  </div>
                )}
                {item.requirements.map(({ key, value }) => (
                  <div key={key}>
                    <dt>
                      <OrderIcon name={REQ_ICONS[key] ?? 'tag'} size={14} />
                      {t.keys[key] ?? key}
                    </dt>
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
