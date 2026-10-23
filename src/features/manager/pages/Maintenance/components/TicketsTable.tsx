import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { Button, TableCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import {
  ticketSeverityTone,
  ticketStatusTone,
} from '../../../../../shared/lib/statusTone'
import { formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { isActiveTicket } from '../maintenanceHelpers'
import { maintenancePageMessages } from '../MaintenancePage.messages'

export function TicketsTable({
  tickets,
  total,
  selectedId,
  onSelect,
  onAssign,
  onResolve,
}: {
  tickets: MaintenanceTicket[]
  total: number
  selectedId: string | null
  onSelect: (ticket: MaintenanceTicket) => void
  onAssign: (ticket: MaintenanceTicket) => void
  onResolve: (ticket: MaintenanceTicket) => void
}) {
  const { t, locale } = useI18n(maintenancePageMessages)
  return (
    <TableCard footer={t.resultCount(tickets.length, total)}>
      <table className="odm-or-table">
        <thead>
          <tr>
            <th>{t.columns.ticket}</th>
            <th>{t.columns.issue}</th>
            <th>{t.columns.severity}</th>
            <th>{t.columns.status}</th>
            <th>{t.columns.assignee}</th>
            <th>{t.columns.created}</th>
            <th className="odm-or-table-action">{t.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => {
            const active = isActiveTicket(ticket)
            return (
              <tr
                key={ticket.id}
                className={selectedId === ticket.id ? 'is-selected' : undefined}
                onClick={() => onSelect(ticket)}
              >
                <td>
                  <div className="odm-or-cell-main odm-mono">{ticket.code}</div>
                  <div className="odm-or-cell-sub">{ticket.droneCode}</div>
                </td>
                <td>
                  <div className="odm-or-cell-main odm-or-cell-clamp">
                    {formatTicketTitle(ticket.title)}
                  </div>
                  {ticket.issueType ? (
                    <div className="odm-or-cell-sub">{ticket.issueType}</div>
                  ) : null}
                </td>
                <td>
                  <StatusBadge
                    kind="ticketSeverity"
                    status={ticket.priority}
                    tone={ticketSeverityTone[ticket.priority]}
                  />
                </td>
                <td>
                  <StatusBadge
                    kind="ticketStatus"
                    status={ticket.status}
                    tone={ticketStatusTone[ticket.status]}
                  />
                </td>
                <td>{ticket.assignedTo ?? t.unassigned}</td>
                <td>{new Date(ticket.openedAt).toLocaleDateString(locale)}</td>
                <td className="odm-or-table-action">
                  <div className="odm-or-row-actions">
                    <Button
                      size="sm"
                      disabled={!active}
                      onClick={(e) => {
                        e.stopPropagation()
                        onAssign(ticket)
                      }}
                    >
                      {ticket.assignedTo ? t.reassign : t.assign}
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={!active}
                      onClick={(e) => {
                        e.stopPropagation()
                        onResolve(ticket)
                      }}
                    >
                      {t.resolve}
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </TableCard>
  )
}
