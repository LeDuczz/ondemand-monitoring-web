// MNG-10: Maintenance ticket list with Manager Search, Filter & System Operator Assignment Workflow
import { useMemo, useState } from 'react'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { PageHeader } from '../../../../shared/components/ui'
import { maintenanceApi } from '../../api/maintenanceApi'
import type { MaintenanceTicket } from '../../types/maintenance'
import '../../manager.css'
import { useI18n } from '../../../../shared/i18n'
import { maintenancePageMessages } from './MaintenancePage.messages'
import type { StatusFilter } from './maintenanceHelpers'
import { DetailPanel } from './components/DetailPanel'
import { AssignModal } from './components/AssignModal'
import { CreateModal } from './components/CreateModal'
import { MaintenanceStats } from './components/MaintenanceStats'
import { MaintenanceEmptyState } from './components/MaintenanceEmptyState'
import { TicketsTable } from './components/TicketsTable'
import { TicketFilterBar } from './components/TicketFilterBar'
import { MaintenanceLoadError } from './components/MaintenanceLoadError'

export function MaintenancePage() {
  const { t } = useI18n(maintenancePageMessages)
  const [tickets, setTickets] = useState<MaintenanceTicket[] | null>(null)
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicket | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [assignTicket, setAssignTicket] = useState<MaintenanceTicket | null>(
    null,
  )

  // Manager Search & Filter controls state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')
  const [assignedFilter, setAssignedFilter] = useState<string>('ALL')

  const query = useApiQuery(
    (signal) => maintenanceApi.listTickets({ signal }),
    [],
  )

  const allTickets = tickets ?? query.data?.items ?? []

  // Filtered tickets based on search query, priority, and assignment status
  const filteredTickets = useMemo(() => {
    return allTickets.filter((t) => {
      // Search text check
      const q = searchQuery.toLowerCase().trim()
      const matchQuery =
        !q ||
        t.code.toLowerCase().includes(q) ||
        t.droneCode.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.assignedTo && t.assignedTo.toLowerCase().includes(q))

      // Priority check
      const matchPriority =
        priorityFilter === 'ALL' || t.priority === priorityFilter

      // Assigned check
      const matchAssigned =
        assignedFilter === 'ALL' ||
        (assignedFilter === 'UNASSIGNED' && !t.assignedTo) ||
        (assignedFilter === 'ASSIGNED' && !!t.assignedTo)

      const matchStatus = statusFilter === 'ALL' || t.status === statusFilter

      return matchQuery && matchPriority && matchAssigned && matchStatus
    })
  }, [allTickets, searchQuery, statusFilter, priorityFilter, assignedFilter])

  function handleTicketUpdated(updated: MaintenanceTicket) {
    const base = tickets ?? query.data?.items ?? []
    setTickets(base.map((t) => (t.id === updated.id ? updated : t)))
    if (selectedTicket?.id === updated.id) {
      setSelectedTicket(updated)
    }
    setAssignTicket(null)
  }

  function handleCreated(ticket: MaintenanceTicket) {
    const base = tickets ?? query.data?.items ?? []
    setTickets([ticket, ...base])
    setShowCreate(false)
  }

  const ready = !query.loading && !query.error
  return (
    <div className="odm-or">
      <PageHeader
        title={t.title}
        subtitle={ready ? t.ticketCount(allTickets.length) : undefined}
        actions={
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => setShowCreate(true)}
          >
            {t.createButton}
          </button>
        }
      />

      {ready && allTickets.length > 0 && (
        <MaintenanceStats tickets={allTickets} />
      )}

      <TicketFilterBar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        assignedFilter={assignedFilter}
        setAssignedFilter={setAssignedFilter}
      />

      <div
        className={`odm-or-list-layout${selectedTicket ? ' has-panel' : ''}`}
      >
        <div className="odm-or-col">
          {query.loading && (
            <div aria-busy="true">
              <span className="odm-sk mng-dash-sk" />
            </div>
          )}

          <MaintenanceLoadError query={query} />

          {ready && filteredTickets.length === 0 && <MaintenanceEmptyState />}

          {ready && filteredTickets.length > 0 && (
            <TicketsTable
              tickets={filteredTickets}
              selectedId={selectedTicket?.id ?? null}
              onSelect={setSelectedTicket}
              onAssignClick={setAssignTicket}
            />
          )}
        </div>

        {ready && selectedTicket && (
          <DetailPanel
            key={selectedTicket.id}
            ticket={selectedTicket}
            onClose={() => setSelectedTicket(null)}
            onAssignClick={(ticket) => setAssignTicket(ticket)}
          />
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreated}
        />
      )}

      {assignTicket && (
        <AssignModal
          ticket={assignTicket}
          onClose={() => setAssignTicket(null)}
          onAssigned={handleTicketUpdated}
        />
      )}
    </div>
  )
}
