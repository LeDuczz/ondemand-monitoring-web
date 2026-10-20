// Mock-only customer order actions. The BE has no endpoint for these, so the
// UI marks them with a MockDataBadge:
//   POST /api/customer/orders/:id/cancel
//   POST /api/customer/orders/:id/analysis/findings/:fid/apply
//   POST /api/customer/orders/:id/analysis/findings/:fid/ignore
// Everything else the customer reads or creates is served in BE shape by
// customerOrdersBe.ts, customerCreateOrderBe.ts, customerMissionHistoryBe.ts
// and customerMediaBe.ts.
import type { OrderStatus } from '../../shared/types/domain'
import { fail, ok, registerMockRoutes } from '../mockServer'
import {
  createdOrders,
  customerAnalyses,
  orders,
  toBeOrder,
} from './customerOrdersStore'

registerMockRoutes([
  // Cancel an order (mock only; the BE has no cancel endpoint).
  {
    method: 'POST',
    path: '/api/customer/orders/:id/cancel',
    handler: ({ params }) => {
      const { id } = params
      const order = orders.find((o) => o.id === id)
      if (!order) {
        // Orders made through POST /api/orders live in the BE-shape store.
        const made = createdOrders.find((o) => o.id === id)
        if (!made) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.')
        if (made.orderStatus !== 'PENDING' && made.orderStatus !== 'APPROVED')
          return fail(409, 'CANNOT_CANCEL', 'Không thể huỷ đơn ở trạng thái này.')
        made.orderStatus = 'CANCELLED'
        made.updatedAt = new Date().toISOString()
        return ok(made)
      }
      const cancellable: OrderStatus[] = [
        'DRAFT',
        'AI_ANALYZED',
        'SUBMITTED',
        'PENDING',
        'APPROVED',
        'SCHEDULED',
      ]
      if (!cancellable.includes(order.status as OrderStatus))
        return fail(409, 'CANNOT_CANCEL', 'Không thể huỷ đơn ở trạng thái này.')
      const now = new Date().toISOString()
      order.status = 'CANCELLED'
      order.canCancel = false
      ;(order.statusHistory as unknown[]).push({
        status: 'CANCELLED',
        at: now,
        actorName: null,
        note: 'Khách huỷ',
      })
      return ok(toBeOrder(order))
    },
  },

  // Apply / ignore a finding suggestion: mock only (no BE endpoint). The
  // decision is written into the analysis served by
  // GET /api/orders/:id/analysis/latest.
  ...(['apply', 'ignore'] as const).map((action) => ({
    method: 'POST' as const,
    path: `/api/customer/orders/:id/analysis/findings/:fid/${action}`,
    handler: ({ params }: { params: Record<string, string> }) => {
      const { id, fid } = params
      const finding = customerAnalyses[id]?.findings.find((f) => f.id === fid)
      if (!finding) return fail(404, 'NOT_FOUND', 'Không tìm thấy finding.')
      const state = action === 'apply' ? 'ACCEPTED' : 'IGNORED'
      finding.suggestionState = state
      return ok({ findingId: fid, state })
    },
  })),
])
