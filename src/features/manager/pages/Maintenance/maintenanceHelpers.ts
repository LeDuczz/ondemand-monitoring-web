import type {
  TicketStatus,
  TicketSeverity,
} from '../../../../shared/types/domain'
import type { MaintenanceTicket } from '../../types/maintenance'

export type StatusFilter = 'ALL' | TicketStatus
export type PriorityFilter = 'ALL' | TicketSeverity

export const STATUS_FILTERS: StatusFilter[] = [
  'ALL',
  'OPEN',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
]

export const SEVERITIES: TicketSeverity[] = [
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL',
]

/** Backend statuses for which the ticket can still be assigned or resolved. */
export function isActiveTicket(ticket: MaintenanceTicket): boolean {
  return ticket.status === 'OPEN' || ticket.status === 'IN_PROGRESS'
}

export function ticketStats(tickets: MaintenanceTicket[]) {
  return {
    open: tickets.filter((t) => t.status === 'OPEN').length,
    inProgress: tickets.filter((t) => t.status === 'IN_PROGRESS').length,
    resolved: tickets.filter((t) => t.status === 'RESOLVED').length,
    highSeverity: tickets.filter(
      (t) =>
        isActiveTicket(t) &&
        (t.priority === 'HIGH' || t.priority === 'CRITICAL'),
    ).length,
  }
}

export function matchesTicketSearch(
  ticket: MaintenanceTicket,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return [
    ticket.code,
    ticket.droneCode,
    ticket.title,
    ticket.issueType,
    ticket.assignedTo,
  ].some((value) => value?.toLowerCase().includes(q))
}
