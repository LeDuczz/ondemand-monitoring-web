import type { TicketSeverity, TicketStatus } from '../../../shared/types/domain'

export type MaintenanceTicket = {
  id: string
  code: string
  title: string
  status: TicketStatus
  priority: TicketSeverity
  droneId: string
  droneCode: string
  droneName: string | null
  issueType: string | null
  description: string | null
  missionId: string | null
  reportedBy: string | null
  assignedTo: string | null
  downtime_hours: number | null
  resolutionNotes: string | null
  openedAt: string
  resolvedAt: string | null
  closedAt: string | null
}
