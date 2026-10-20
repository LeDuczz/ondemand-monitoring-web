// Mock only the maintenance endpoint missing from the backend contract:
//   POST   /api/maintenance-tickets                              [ĐỀ XUẤT]
// List / assign-staff / resolve are served by the real backend (no mock route).
import type { TicketSeverity, TicketStatus } from '../../shared/types/domain'
import { createCollection } from '../db'
import { created, fail, registerMockRoutes } from '../mockServer'
import ticketsSeed from '../data/maintenance-tickets.json'

type StoredTicket = {
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

const tickets = createCollection(ticketsSeed.tickets) as StoredTicket[]

registerMockRoutes([
  // ── MNG-10: create maintenance ticket [ĐỀ XUẤT] ──────────────────────
  {
    method: 'POST',
    path: '/api/maintenance-tickets',
    handler: ({ body }) => {
      const req = (body ?? {}) as {
        droneId?: string
        title?: string
        issueType?: string
        description?: string
        priority?: TicketSeverity
      }

      if (!req.title?.trim()) {
        return fail(400, 'VALIDATION_ERROR', 'Tiêu đề là bắt buộc', {
          title: 'Bắt buộc',
        })
      }
      if (!req.droneId?.trim()) {
        return fail(400, 'VALIDATION_ERROR', 'Drone là bắt buộc', {
          droneId: 'Bắt buộc',
        })
      }

      const now = new Date().toISOString()
      const newId = `mt-${Date.now()}`
      const ticket: StoredTicket = {
        id: newId,
        code: newId.toUpperCase(),
        title: req.title,
        status: 'OPEN',
        priority: req.priority ?? 'MEDIUM',
        droneId: req.droneId,
        droneCode: req.droneId.toUpperCase(),
        droneName: null,
        issueType: req.issueType ?? null,
        description: req.description ?? null,
        missionId: null,
        reportedBy: null,
        assignedTo: null,
        downtime_hours: null,
        resolutionNotes: null,
        openedAt: now,
        resolvedAt: null,
        closedAt: null,
      }
      tickets.push(ticket)
      return created(ticket, 'Đã tạo ticket bảo trì')
    },
  },
])

/** Test-only escape hatch */
export const __testing = { tickets }
