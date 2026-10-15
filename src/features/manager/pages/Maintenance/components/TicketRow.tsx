import { StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import {
  getTicketSeverityLabel,
  getTicketStatusLabel,
  ticketSeverityTone,
  ticketStatusTone,
} from '../../../../../shared/lib/statusTone'
import { formatTicketTitle } from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { formatAge } from '../maintenanceHelpers'
import { ticketRowMessages } from './TicketRow.messages'

export function TicketRow({
  ticket,
  selected,
  onSelect,
  onAssignClick,
}: {
  ticket: MaintenanceTicket
  selected: boolean
  onSelect: (ticket: MaintenanceTicket) => void
  onAssignClick: (ticket: MaintenanceTicket) => void
}) {
  const { t, lang, locale } = useI18n(ticketRowMessages)
  const active = ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
  const opened = new Date(ticket.openedAt)
  return (
    <tr
      className={selected ? 'is-selected' : undefined}
      onClick={() => onSelect(ticket)}
    >
      <td>
        <div className="mng-cell-main odm-mono">{ticket.code}</div>
        <div className="mng-cell-sub">{ticket.droneCode}</div>
      </td>
      <td>
        <div className="mng-cell-ellipsis">
          {formatTicketTitle(ticket.title)}
        </div>
        {ticket.issueType && (
          <div className="mng-cell-sub mng-cell-ellipsis">
            {ticket.issueType}
          </div>
        )}
      </td>
      <td>
        <StatusBadge tone={toUiTone(ticketSeverityTone[ticket.priority])}>
          {getTicketSeverityLabel(ticket.priority, lang)}
        </StatusBadge>
      </td>
      <td>
        <StatusBadge tone={toUiTone(ticketStatusTone[ticket.status])}>
          {getTicketStatusLabel(ticket.status, lang)}
        </StatusBadge>
      </td>
      <td className="mng-nowrap">
        {ticket.assignedTo ?? (
          <span className="mng-cell-sub">{t.unassigned}</span>
        )}
      </td>
      <td className="mng-nowrap">
        <div>
          {Number.isNaN(opened.getTime())
            ? '—'
            : opened.toLocaleString(locale, {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
        </div>
        <div className="mng-cell-sub">{formatAge(ticket.openedAt, t.age)}</div>
      </td>
      <td className="mng-actions">
        {active && (
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            onClick={(e) => {
              e.stopPropagation()
              onAssignClick(ticket)
            }}
          >
            {ticket.assignedTo ? t.changeOperator : t.assignOperator}
          </button>
        )}
      </td>
    </tr>
  )
}
