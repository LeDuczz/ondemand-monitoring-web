import type { UiTone } from '../../../shared/components/ui'
import type { SupportTicketDto } from '../api/supportApi'

export type TicketStatus = SupportTicketDto['status']

export const TICKET_STATUS_TONE: Record<TicketStatus, UiTone> = {
  OPEN: 'info',
  ASSIGNED: 'warning',
  IN_PROGRESS: 'info',
  WAITING_FOR_CUSTOMER: 'warning',
  WAITING_FOR_STAFF: 'warning',
  RESOLVED: 'success',
  CLOSED: 'neutral',
  CANCELLED: 'neutral',
}

/** A ticket the customer can no longer reply to. */
export function isTicketFinished(status: string): boolean {
  return status === 'RESOLVED' || status === 'CLOSED' || status === 'CANCELLED'
}
