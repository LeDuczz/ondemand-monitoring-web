// MNG-10: Maintenance tickets with search, filters, operator assignment and resolution
import { useMemo, useState } from 'react'
import { StateView } from '../../../../shared/components/odm/StateView'
import { PageHeader, Skeleton } from '../../../../shared/components/ui'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { maintenanceApi } from '../../api/maintenanceApi'
import type { MaintenanceTicket } from '../../types/maintenance'
import '../../manager.css'
import { AssignModal } from './components/AssignModal'
import { DetailPanel } from './components/DetailPanel'
import { MaintenanceLoadError } from './components/MaintenanceLoadError'
import { MaintenanceStats } from './components/MaintenanceStats'
import { MaintenanceToolbar } from './components/MaintenanceToolbar'
import { ResolveModal } from './components/ResolveModal'
import { TicketsTable } from './components/TicketsTable'
import {
  matchesTicketSearch,
  ticketStats,
  type PriorityFilter,
  type StatusFilter,
} from './maintenanceHelpers'
import { maintenancePageMessages } from './MaintenancePage.messages'

export function MaintenancePage() {
  const { t } = useI18n(maintenancePageMessages)
  const [tickets, setTickets] = useState<MaintenanceTicket[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [assignTicket, setAssignTicket] = useState<MaintenanceTicket | null>(null)
  const [resolveTicket, setResolveTicket] = useState<MaintenanceTicket | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusFilter>('ALL')
  const [priority, setPriority] = useState<PriorityFilter>('ALL')

  const query = useApiQuery(
    (signal) => maintenanceApi.listTickets({ signal }),
    [],
  )

  const allTickets = useMemo(
    () => tickets ?? query.data?.items ?? [],
    [tickets, query.data?.items],
  )
  const stats = useMemo(() => ticketStats(allTickets), [allTickets])
  const visible = useMemo(
    () =>
      allTickets.filter(
        (ticket) =>
          matchesTicketSearch(ticket, search) &&
          (status === 'ALL' || ticket.status === status) &&
          (priority === 'ALL' || ticket.priority === priority),
      ),
    [allTickets, search, status, priority],
  )
  const selected = allTickets.find((ticket) => ticket.id === selectedId) ?? null

  function handleTicketUpdated(updated: MaintenanceTicket) {
    const base = tickets ?? query.data?.items ?? []
    setTickets(base.map((ticket) => (ticket.id === updated.id ? updated : ticket)))
    setAssignTicket(null)
    setResolveTicket(null)
  }

  const ready = !query.loading && !query.error

  return (
    <div className="odm-or">
      <PageHeader
        title={t.title}
        subtitle={ready ? t.subtitle(allTickets.length) : undefined}
      />

      <MaintenanceStats stats={stats} />

      <MaintenanceToolbar
        search={search}
        onSearch={setSearch}
        status={status}
        onStatus={setStatus}
        priority={priority}
        onPriority={setPriority}
      />

      {query.loading && (
        <div aria-busy="true">
          <Skeleton variant="block" height={300} />
        </div>
      )}

      {!query.loading && !!query.error && <MaintenanceLoadError query={query} />}

      {ready && visible.length === 0 && (
        <section className="odm-or-card">
          <StateView
            state="empty"
            title={t.emptyTitle}
            description={t.emptyDescription}
          />
        </section>
      )}

      {ready && visible.length > 0 && (
        <div className={`odm-or-list-layout${selected ? ' has-panel' : ''}`}>
          <TicketsTable
            tickets={visible}
            total={allTickets.length}
            selectedId={selectedId}
            onSelect={(ticket) =>
              setSelectedId(selectedId === ticket.id ? null : ticket.id)
            }
            onAssign={setAssignTicket}
            onResolve={setResolveTicket}
          />
          {selected && (
            <DetailPanel
              key={selected.id}
              ticket={selected}
              onClose={() => setSelectedId(null)}
              onAssignClick={setAssignTicket}
              onResolveClick={setResolveTicket}
            />
          )}
        </div>
      )}

      {assignTicket && (
        <AssignModal
          ticket={assignTicket}
          onClose={() => setAssignTicket(null)}
          onAssigned={handleTicketUpdated}
        />
      )}
      {resolveTicket && (
        <ResolveModal
          ticket={resolveTicket}
          onClose={() => setResolveTicket(null)}
          onResolved={handleTicketUpdated}
        />
      )}
    </div>
  )
}
