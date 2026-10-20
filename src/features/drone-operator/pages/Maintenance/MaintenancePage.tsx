import { useMemo, useState } from 'react'

import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../shared/i18n'
import { authSession } from '../../../auth/api/authApi'
import {
  maintenanceTicketApi,
  type MaintenanceTicketDto,
} from '../../api/maintenanceTicketApi'
import { MaintenanceHeader } from './components/MaintenanceHeader'
import { MaintenanceTabs } from './components/MaintenanceTabs'
import { ResolveModal } from './components/ResolveModal'
import { SuccessBanner } from './components/SuccessBanner'
import { TicketList } from './components/TicketList'
import {
  maintenanceDeviceLabel,
  type MaintenanceTab,
} from './maintenanceHelpers'
import { maintenancePageMessages } from './MaintenancePage.messages'

export function MaintenancePage() {
  const { t } = useI18n(maintenancePageMessages)
  const user = authSession.getUser()
  const [activeTab, setActiveTab] = useState<MaintenanceTab>('MY_TICKETS')
  const [selectedTicket, setSelectedTicket] =
    useState<MaintenanceTicketDto | null>(null)
  const [notes, setNotes] = useState('')
  const [targetDroneStatus, setTargetDroneStatus] = useState('AVAILABLE')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const query = useApiQuery(
    (signal) =>
      maintenanceTicketApi.listTickets(undefined, undefined, undefined, signal),
    [],
  )

  const allTickets = query.data || []

  const filteredTickets = useMemo(() => {
    if (activeTab === 'MY_TICKETS') {
      return allTickets.filter(
        (t) =>
          (t.assignedTechnicianId === user?.id ||
            t.assignedTechnicianName === user?.fullName) &&
          (t.status === 'OPEN' || t.status === 'IN_PROGRESS'),
      )
    }
    if (activeTab === 'ALL_ACTIVE') {
      return allTickets.filter(
        (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS',
      )
    }
    return allTickets.filter(
      (t) => t.status === 'RESOLVED' || t.status === 'CLOSED',
    )
  }, [allTickets, activeTab, user])

  const myOpenCount = allTickets.filter(
    (t) =>
      (t.assignedTechnicianId === user?.id ||
        t.assignedTechnicianName === user?.fullName) &&
      (t.status === 'OPEN' || t.status === 'IN_PROGRESS'),
  ).length

  async function handleResolveSubmit() {
    if (!selectedTicket) return
    if (!notes.trim()) {
      setError(t.notesRequiredError)
      return
    }

    setSaving(true)
    setError(null)

    try {
      await maintenanceTicketApi.resolveTicket(selectedTicket.id, {
        resolutionNotes: notes,
        newDeviceStatus: targetDroneStatus,
      })

      setSuccessMsg(
        t.resolveSuccess(
          selectedTicket.ticketCode,
          maintenanceDeviceLabel(selectedTicket),
          targetDroneStatus,
        ),
      )
      setSelectedTicket(null)
      setNotes('')
      query.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : t.resolveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100, margin: '0 auto' }}>
      <MaintenanceHeader
        myOpenCount={myOpenCount}
        totalCount={allTickets.length}
      />

      {successMsg && (
        <SuccessBanner
          message={successMsg}
          onClose={() => setSuccessMsg(null)}
        />
      )}

      <MaintenanceTabs
        activeTab={activeTab}
        onChange={setActiveTab}
        myOpenCount={myOpenCount}
        activeCount={
          allTickets.filter(
            (ticket) =>
              ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS',
          ).length
        }
        resolvedCount={
          allTickets.filter(
            (ticket) =>
              ticket.status === 'RESOLVED' || ticket.status === 'CLOSED',
          ).length
        }
      />

      <TicketList
        loading={query.loading}
        tickets={filteredTickets}
        onUpdate={(ticket) => {
          setSelectedTicket(ticket)
          setError(null)
        }}
      />

      {selectedTicket && (
        <ResolveModal
          ticket={selectedTicket}
          notes={notes}
          onNotesChange={setNotes}
          targetDroneStatus={targetDroneStatus}
          onTargetDroneStatusChange={setTargetDroneStatus}
          error={error}
          saving={saving}
          onClose={() => setSelectedTicket(null)}
          onSubmit={handleResolveSubmit}
        />
      )}
    </div>
  )
}
