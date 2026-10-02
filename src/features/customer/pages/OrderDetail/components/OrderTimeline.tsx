import { Card } from '../../../../../shared/components/ui'
import { useI18n, useLanguage } from '../../../../../shared/i18n'
import { fmtDateTime, getOrderStatusMeta } from '../../../lib/orderStatus'
import type { OrderTimelineEvent } from '../../../lib/orders/types'
import { CardTitle } from './CardTitle'
import { orderTimelineMessages } from './OrderTimeline.messages'

/** Timeline derived from the few dates the BE returns (it keeps no history). */
export function OrderTimeline({ events }: { events: OrderTimelineEvent[] }) {
  const { t, locale } = useI18n(orderTimelineMessages)
  const { lang } = useLanguage()
  if (events.length === 0) return null

  const label = (event: OrderTimelineEvent) => {
    if (event.kind === 'created') return t.created
    if (event.kind === 'approved') return t.approved
    if (event.kind === 'rejected') return t.rejected
    return event.status ? getOrderStatusMeta(event.status, lang).label : ''
  }

  return (
    <Card title={<CardTitle icon="clock">{t.title}</CardTitle>}>
      <ol className="od-timeline">
        {events.map((event) => (
          <li key={`${event.kind}-${event.at}`} className={`od-timeline-item is-${event.kind}`}>
            <div className="od-timeline-label">{label(event)}</div>
            <div className="od-timeline-meta">
              {fmtDateTime(event.at, locale)}
              {event.actor ? ` · ${t.by(event.actor)}` : ''}
            </div>
            {event.note && <div className="od-timeline-note">{event.note}</div>}
          </li>
        ))}
      </ol>
    </Card>
  )
}
