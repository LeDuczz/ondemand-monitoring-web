import { useState } from 'react'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { authSession } from '../../../../auth/api/authApi'
import { supportApi } from '../../../api/supportApi'

/** The signed-in customer's tickets, with a status filter applied client-side. */
export function useTicketsList() {
  const [statusFilter, setStatusFilter] = useState('ALL')
  const currentUserId = authSession.getUser()?.id

  const query = useApiQuery(
    (signal) => supportApi.listTickets(currentUserId, undefined, signal),
    [currentUserId],
  )

  const tickets = query.data ?? []
  const filtered = tickets.filter((ticket) => statusFilter === 'ALL' || ticket.status === statusFilter)

  return {
    loading: query.loading,
    loaded: query.data !== undefined,
    error: query.error,
    reload: query.reload,
    tickets: filtered,
    statusFilter,
    setStatusFilter,
  }
}
