// Mock handlers for MNG-10. Endpoints:
//   GET    /api/maintenance-tickets?status=&droneId=&priority=   [TK]
//   POST   /api/maintenance-tickets                              [ĐỀ XUẤT]
//   PATCH  /api/maintenance-tickets/:id/status                  [ĐỀ XUẤT]
import type { TicketSeverity, TicketStatus } from '../../shared/types/domain'
import { createCollection } from '../db'
import { created, fail, ok, registerMockRoutes } from '../mockServer'
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

// Valid status transitions [ĐỀ XUẤT per MNG-10 design context]
const VALID_TICKET_TRANSITIONS: Record<TicketStatus, TicketStatus[]> = {
  OPEN: ['IN_PROGRESS', 'RESOLVED'],
  IN_PROGRESS: ['RESOLVED', 'OPEN'],
  RESOLVED: ['CLOSED', 'IN_PROGRESS'],
  CLOSED: [],
}

registerMockRoutes([
  // ── MNG-10: list maintenance tickets [TK] ─────────────────────────────
  {
    method: 'GET',
    path: '/api/maintenance-tickets',
    handler: ({ query }) => {
      const statusFilter = query.get('status') as TicketStatus | null
      const droneIdFilter = query.get('droneId')
      const priorityFilter = query.get('priority') as TicketSeverity | null

      const items = tickets.filter((t) => {
        if (statusFilter && t.status !== statusFilter) return false
        if (droneIdFilter && t.droneId !== droneIdFilter) return false
        if (priorityFilter && t.priority !== priorityFilter) return false
        return true
      })

      return ok({ items, total: items.length })
    },
  },

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

  // ── MNG-10: patch ticket status [ĐỀ XUẤT] ────────────────────────────
  {
    method: 'PATCH',
    path: '/api/maintenance-tickets/:id/status',
    handler: ({ params, body }) => {
      const ticket = tickets.find(
        (t) => t.id === params.id || t.code === params.id,
      )
      if (!ticket) return fail(404, 'NOT_FOUND', 'Không tìm thấy ticket')

      const req = (body ?? {}) as { status?: TicketStatus }
      const validNext = VALID_TICKET_TRANSITIONS[ticket.status] ?? []

      if (!req.status || !validNext.includes(req.status)) {
        return fail(
          422,
          'INVALID_TRANSITION',
          `Không thể chuyển từ ${ticket.status} sang ${req.status ?? '(trống)'}`,
        )
      }

      ticket.status = req.status
      if (req.status === 'RESOLVED' && !ticket.resolvedAt) {
        ticket.resolvedAt = new Date().toISOString()
      }
      if (req.status === 'CLOSED' && !ticket.closedAt) {
        ticket.closedAt = new Date().toISOString()
      }

      return ok(ticket, 'Đã cập nhật trạng thái ticket')
    },
  },
])

/** Test-only escape hatch */
export const __testing = { tickets }
