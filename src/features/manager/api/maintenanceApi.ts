import { apiRequest } from '../../../shared/api/httpClient'
import type { TicketSeverity, TicketStatus } from '../../../shared/types/domain'
import type { MaintenanceTicket } from '../types/maintenance'

export const maintenanceApi = {
  /** `GET /api/maintenance-tickets?status=&droneId=&priority=` [TK]. */
  listTickets(options?: {
    status?: TicketStatus
    droneId?: string
    priority?: TicketSeverity
    signal?: AbortSignal
  }): Promise<{ items: MaintenanceTicket[]; total: number }> {
    const query: Record<string, string> = {}
    if (options?.status) query['status'] = options.status
    if (options?.droneId) query['droneId'] = options.droneId
    if (options?.priority) query['priority'] = options.priority
    return apiRequest<{ items: MaintenanceTicket[]; total: number }>(
      '/api/maintenance-tickets',
      { query, signal: options?.signal },
    )
  },

  /** `POST /api/maintenance-tickets` [ĐỀ XUẤT]. */
  createTicket(data: {
    droneId: string
    title: string
    issueType?: string
    description?: string
    priority?: TicketSeverity
  }): Promise<MaintenanceTicket> {
    return apiRequest<MaintenanceTicket>('/api/maintenance-tickets', {
      method: 'POST',
      body: data,
    })
  },

  /** `PATCH /api/maintenance-tickets/{id}/status` [ĐỀ XUẤT]. */
  patchTicketStatus(
    ticketId: string,
    status: TicketStatus,
  ): Promise<MaintenanceTicket> {
    return apiRequest<MaintenanceTicket>(
      `/api/maintenance-tickets/${ticketId}/status`,
      { method: 'PATCH', body: { status } },
    )
  },
}
