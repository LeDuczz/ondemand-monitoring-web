import { TableCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { ticketsTableMessages } from './TicketsTable.messages'
import { TicketRow } from './TicketRow'

export function TicketsTable({
  tickets,
  selectedId,
  onSelect,
  onAssignClick,
}: {
  tickets: MaintenanceTicket[]
  selectedId: string | null
  onSelect: (ticket: MaintenanceTicket) => void
  onAssignClick: (ticket: MaintenanceTicket) => void
}) {
  const { t } = useI18n(ticketsTableMessages)
  return (
    <TableCard>
      <table className="mng-table">
        <thead>
          <tr>
            <th>{t.columns.ticket}</th>
            <th>{t.columns.issue}</th>
            <th>{t.columns.severity}</th>
            <th>{t.columns.status}</th>
            <th>{t.columns.assignee}</th>
            <th>{t.columns.created}</th>
            <th>
              <span className="mng-sr-only">{t.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <TicketRow
              key={ticket.id}
              ticket={ticket}
              selected={selectedId === ticket.id}
              onSelect={onSelect}
              onAssignClick={onAssignClick}
            />
          ))}
        </tbody>
      </table>
    </TableCard>
  )
}
