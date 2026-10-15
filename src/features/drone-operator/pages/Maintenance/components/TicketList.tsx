import { useI18n } from '../../../../../shared/i18n'
import type { MaintenanceTicketDto } from '../../../api/maintenanceTicketApi'
import { TicketCard } from './TicketCard'
import { ticketListMessages } from './TicketList.messages'

export function TicketList({
  loading,
  tickets,
  onUpdate,
}: {
  loading: boolean
  tickets: MaintenanceTicketDto[]
  onUpdate: (ticket: MaintenanceTicketDto) => void
}) {
  const { t } = useI18n(ticketListMessages)

  return (
    <>
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div
            className="odm-sk"
            style={{ height: 120, borderRadius: 12, marginBottom: 12 }}
          />
          <div className="odm-sk" style={{ height: 120, borderRadius: 12 }} />
        </div>
      ) : tickets.length === 0 ? (
        <div
          className="odm-card"
          style={{
            padding: '48px 24px',
            textAlign: 'center',
            color: '#94a3b8',
            borderRadius: 14,
            border: '1px solid #e2e8f0',
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 15,
              color: '#1e293b',
              fontWeight: 600,
            }}
          >
            {t.emptyTitle}
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 13 }}>{t.emptyBody}</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}
        >
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </>
  )
}
