import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { Button, Card } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import {
  ticketSeverityTone,
  ticketStatusTone,
} from '../../../../../shared/lib/statusTone'
import {
  formatTicketDescription,
  formatTicketTitle,
} from '../../../lib/ticketText'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { isActiveTicket } from '../maintenanceHelpers'
import { maintenancePageMessages } from '../MaintenancePage.messages'

export type DetailPanelProps = {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssignClick: (ticket: MaintenanceTicket) => void
  onResolveClick: (ticket: MaintenanceTicket) => void
}

export function DetailPanel({
  ticket,
  onClose,
  onAssignClick,
  onResolveClick,
}: DetailPanelProps) {
  const { t, locale } = useI18n(maintenancePageMessages)
  const active = isActiveTicket(ticket)
  const rows: Array<{ label: string; value: string }> = [
    { label: t.detail.device, value: ticket.droneCode },
  ]
  if (ticket.issueType)
    rows.push({ label: t.detail.issueType, value: ticket.issueType })
  if (ticket.description)
    rows.push({
      label: t.detail.description,
      value: formatTicketDescription(ticket.description),
    })
  if (ticket.reportedBy)
    rows.push({ label: t.detail.reportedBy, value: ticket.reportedBy })
  rows.push({
    label: t.detail.assignee,
    value: ticket.assignedTo ?? t.unassigned,
  })
  rows.push({
    label: t.detail.createdAt,
    value: new Date(ticket.openedAt).toLocaleString(locale),
  })
  if (ticket.resolvedAt)
    rows.push({
      label: t.detail.resolvedAt,
      value: new Date(ticket.resolvedAt).toLocaleString(locale),
    })
  if (ticket.resolutionNotes)
    rows.push({ label: t.detail.resolution, value: ticket.resolutionNotes })

  return (
    <Card
      className="odm-or-sidepanel"
      title={<span className="odm-mono">{ticket.code}</span>}
      actions={
        <Button size="sm" variant="ghost" onClick={onClose} aria-label={t.detail.close}>
          ✕
        </Button>
      }
    >
      <div className="odm-or-panel-stack">
        <div className="odm-or-cell-main">{formatTicketTitle(ticket.title)}</div>
        <div className="odm-or-panel-status">
          <StatusBadge
            kind="ticketStatus"
            status={ticket.status}
            tone={ticketStatusTone[ticket.status]}
          />
          <StatusBadge
            kind="ticketSeverity"
            status={ticket.priority}
            tone={ticketSeverityTone[ticket.priority]}
          />
        </div>
        <dl className="odm-or-kv odm-or-kv-pre">
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
        {active && (
          <div className="odm-or-row-actions">
            <Button size="sm" onClick={() => onAssignClick(ticket)}>
              {ticket.assignedTo ? t.reassign : t.assign}
            </Button>
            <Button size="sm" variant="primary" onClick={() => onResolveClick(ticket)}>
              {t.resolve}
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
