import { Card, StatusBadge } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { fmtDateTime } from '../../../../customer/lib/orderStatus'
import { customerHref } from '../../../../customer/routes'
import type { SupportTicketDto } from '../../../api/supportApi'
import { TicketStatusBadge } from '../../../components/TicketStatusBadge'
import { ticketLabelsMessages } from '../../../lib/ticketLabels.messages'
import { customerTicketDetailMessages } from '../CustomerTicketDetailPage.messages'

export function TicketOverview({ ticket }: { ticket: SupportTicketDto }) {
  const { t, locale } = useI18n(customerTicketDetailMessages)
  const { t: labels } = useI18n(ticketLabelsMessages)
  const category = labels.category[ticket.category as keyof typeof labels.category] ?? ticket.category
  const priorityLabel = labels.priority[ticket.priority] ?? ticket.priority
  const urgent = ticket.priority === 'URGENT' || ticket.priority === 'HIGH'

  return (
    <aside className="td-side">
      <Card title={t.ticketFacts}>
        <dl className="td-facts">
          <div>
            <dt>{t.statusLabel}</dt>
            <dd>
              <TicketStatusBadge status={ticket.status} />
            </dd>
          </div>
          <div>
            <dt>{t.categoryLabel}</dt>
            <dd>
              <span className="sp-chip">{category}</span>
            </dd>
          </div>
          <div>
            <dt>{t.priorityLabel}</dt>
            <dd>
              <StatusBadge tone={urgent ? 'danger' : 'neutral'}>{priorityLabel}</StatusBadge>
            </dd>
          </div>
          <div>
            <dt>{t.openedLabel}</dt>
            <dd>{fmtDateTime(ticket.openedAt, locale)}</dd>
          </div>
          {ticket.assignedStaffName && (
            <div>
              <dt>{t.assignedStaff}</dt>
              <dd>{ticket.assignedStaffName}</dd>
            </div>
          )}
          {ticket.orderId && (
            <div>
              <dt>{t.relatedOrder}</dt>
              <dd>
                <a href={customerHref({ screen: 'orderDetail', orderId: ticket.orderId })}>{t.viewOrder}</a>
              </dd>
            </div>
          )}
          {ticket.missionId && (
            <div>
              <dt>{t.relatedMission}</dt>
              <dd>
                <a href={customerHref({ screen: 'orderDetail', orderId: ticket.orderId || ticket.missionId })}>
                  {t.viewMission}
                </a>
              </dd>
            </div>
          )}
        </dl>
      </Card>
    </aside>
  )
}
