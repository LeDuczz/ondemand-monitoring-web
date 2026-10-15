import type { MaintenanceTicketDto } from '../../api/maintenanceTicketApi'

export type MaintenanceTab = 'MY_TICKETS' | 'ALL_ACTIVE' | 'RESOLVED'

export function maintenanceDeviceLabel(ticket: MaintenanceTicketDto) {
  return ticket.deviceCode || ticket.droneCode || ticket.deviceId || 'DEVICE'
}
