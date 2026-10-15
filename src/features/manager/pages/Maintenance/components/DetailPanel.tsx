import {
  Card,
  StatusBadge,
  toUiTone,
} from '../../../../../shared/components/ui'
import { Icon } from '../../../../../shared/components/Icon'
import { useI18n } from '../../../../../shared/i18n'
import {
  formatTicketTitle,
  formatTicketDescription,
} from '../../../lib/ticketText'
import {
  ticketStatusTone,
  getTicketStatusLabel,
  ticketSeverityTone,
  getTicketSeverityLabel,
} from '../../../../../shared/lib/statusTone'
import type { MaintenanceTicket } from '../../../types/maintenance'
import { detailPanelMessages } from './DetailPanel.messages'

type DetailPanelProps = {
  ticket: MaintenanceTicket
  onClose: () => void
  onAssignClick: (ticket: MaintenanceTicket) => void
}

export function DetailPanel({
  ticket,
  onClose,
  onAssignClick,
}: DetailPanelProps) {
  const { t, lang, locale } = useI18n(detailPanelMessages)
  const rows: Array<{ label: string; value: string }> = [
    {
      label: t.detail.device,
      value: `${ticket.droneCode}${ticket.droneName ? ` (${ticket.droneName})` : ''}`,
    },
  ]
  if (ticket.issueType)
    rows.push({ label: t.detail.issueType, value: ticket.issueType })
  if (ticket.reportedBy)
    rows.push({ label: t.detail.reportedBy, value: ticket.reportedBy })
  rows.push({
    label: t.detail.assignedOperator,
    value: ticket.assignedTo ?? t.detail.unassigned,
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

  return (
    <Card
      className="odm-or-sidepanel"
      title={<span className="odm-mono">{ticket.code}</span>}
      actions={
        <button
          type="button"
          className="odm-or-icon-btn"
          onClick={onClose}
          aria-label={t.detail.close}
        >
          <Icon name="x" width={16} height={16} />
        </button>
      }
    >
      <div style={{ display: 'grid', gap: 14 }}>
        <div className="mng-panel-title">{formatTicketTitle(ticket.title)}</div>
        <div className="mng-panel-badges">
          <StatusBadge tone={toUiTone(ticketStatusTone[ticket.status])}>
            {getTicketStatusLabel(ticket.status, lang)}
          </StatusBadge>
          <StatusBadge tone={toUiTone(ticketSeverityTone[ticket.priority])}>
            {getTicketSeverityLabel(ticket.priority, lang)}
          </StatusBadge>
        </div>

        <dl className="odm-or-kv">
          {rows.map((row) => (
            <div key={row.label}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>

        {ticket.description && (
          <div>
            <div className="mng-panel-label">{t.detail.description}</div>
            <div className="mng-panel-note">
              {formatTicketDescription(ticket.description)}
            </div>
          </div>
        )}

        {ticket.resolutionNotes && (
          <div>
            <div className="mng-panel-label">{t.detail.resolutionReport}</div>
            <div className="mng-panel-note is-success">
              {ticket.resolutionNotes}
            </div>
          </div>
        )}

        {(ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS') && (
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => onAssignClick(ticket)}
          >
            {ticket.assignedTo
              ? t.detail.changeOperator
              : t.detail.assignOperator}
          </button>
        )}

        {ticket.status === 'RESOLVED' && (
          <StatusBadge tone="success">{t.detail.resolvedDone}</StatusBadge>
        )}
      </div>
    </Card>
  )
}
