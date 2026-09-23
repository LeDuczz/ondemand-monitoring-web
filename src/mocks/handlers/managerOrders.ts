// Mock handlers for the MNG-02 (order queue) and MNG-03 (order review) APIs,
// and MNG-11 (deliver results). Endpoints per evd/00-PLAN.md §3:
//   GET  /api/orders?status=PENDING          [TK path; BE OrderStatus value]
//   GET  /api/orders/{id}                    [TK]
//   GET  /api/orders/{id}/analysis/latest    [BRIEF C4]
//   GET  /api/orders/{id}/resource-preview   PROPOSED (no source endpoint)
//   PUT  /api/orders/{id}/internal-note      PROPOSED (no source endpoint)
//   POST /api/orders/{id}/approve            [BE] (creates a mission)
//   POST /api/orders/{id}/approval           [BRIEF C4] {decision, reason}
//   POST /api/orders/{id}/deliver            [BRIEF C4] mark as delivered
import type {
  ApprovalDecision,
  OrderAnalysis,
  OrderDetail,
  OrderInternalNote,
  OrderQueueItem,
  OrderResourcePreview,
} from '../../features/manager/types/orders'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import analysesSeed from '../data/order-analyses.json'
import { missions, newMinimalMission } from './missionsStore'
import { findOrder, orders, type SeedOrder } from './ordersStore'

type Approval = {
  orderId: string
  decision: ApprovalDecision
  reason: string
  reviewerId: string
  decidedAt: string
}

const REVIEWER_NAME = 'Lê Thị Thanh Hằng'
const REVIEWER_ID = 'staff-hang-le'

// Each collection is created from the exact object/array we hold a
// reference to (not a nested property read off a bigger createCollection()
// result) — `createCollection`'s reset only keeps identity for the value it
// was given directly (arrays are spliced in place; objects have their keys
// replaced in place). Reading `createCollection(seed).nested` instead would
// leave `nested` pointing at the pre-reset value forever.
const analyses = createCollection(analysesSeed.analyses) as unknown as Record<
  string,
  OrderAnalysis
>
const resourcePreviews = createCollection(
  analysesSeed.resourcePreviews,
) as unknown as Record<string, OrderResourcePreview>
const internalNotes = createCollection(
  analysesSeed.internalNotes,
) as unknown as Record<string, OrderInternalNote>
const approvals = createCollection([] as Approval[])

function latestApprovalFor(orderId: string): Approval | undefined {
  const forOrder = approvals.filter((a) => a.orderId === orderId)
  return forOrder[forOrder.length - 1]
}

function toQueueItem(order: SeedOrder): OrderQueueItem {
  return {
    id: order.id,
    code: order.code,
    customer: {
      fullName: order.customer.fullName,
      companyName: order.customer.companyName,
    },
    serviceName: order.serviceName,
    preferredDate: order.preferredDate,
    preferredTimeName: order.preferredTimeName,
    submittedAt: order.submittedAt,
    aiVerdict: order.aiVerdict,
    blockerCount: order.blockerCount,
    warningCount: order.warningCount,
  }
}

function toDetail(order: SeedOrder): OrderDetail {
  return {
    id: order.id,
    code: order.code,
    status: order.status,
    customer: order.customer,
    serviceName: order.serviceName,
    preferredDate: order.preferredDate,
    preferredTimeName: order.preferredTimeName,
    preferredWindow: order.preferredWindow,
    submittedAt: order.submittedAt,
    addressText: order.addressText,
    center: order.center,
    radiusM: order.radiusM,
    nearestBase: order.nearestBase,
    mediaRequirements: order.mediaRequirements,
    purpose: order.purpose,
    attachments: order.attachments,
  }
}

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/orders',
    handler: ({ query }) => {
      const status = query.get('status')
      if (status && status !== 'PENDING') {
        return ok<OrderQueueItem[]>([])
      }
      const rows = orders
        .filter((o) => o.status === 'PENDING')
        .filter((o) => latestApprovalFor(o.id)?.decision !== 'NEED_INFO')
        .map(toQueueItem)
      return ok(rows)
    },
  },
  {
    method: 'GET',
    path: '/api/orders/:id',
    handler: ({ params }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      if (order.status !== 'PENDING') {
        return fail(
          409,
          'ORDER_NOT_UNDER_REVIEW',
          'Đơn không còn ở trạng thái chờ duyệt (đã được xử lý bởi đồng nghiệp) hoặc máy chủ lỗi.',
        )
      }
      return ok(toDetail(order))
    },
  },
  {
    method: 'GET',
    path: '/api/orders/:id/analysis/latest',
    handler: ({ params }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      const found = analyses[order.code]
      if (found) return ok(found)
      // No design-sourced analysis for this order — verdict/counts are
      // still the evidenced queue-row values, but the analysis-only fields
      // (rule engine timing, LLM summary, findings) have no source, so they
      // go null/empty instead of being invented.
      const fallback: OrderAnalysis = {
        overallVerdict: order.aiVerdict,
        blockerCount: order.blockerCount,
        warningCount: order.warningCount,
        ruleEngineMs: null,
        createdAt: null,
        llmSummary: null,
        findings: [],
      }
      return ok(fallback)
    },
  },
  {
    method: 'GET',
    path: '/api/orders/:id/resource-preview',
    handler: ({ params }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      // null (not an invented default) for orders without a design-sourced
      // resource preview.
      return ok<OrderResourcePreview | null>(
        resourcePreviews[order.code] ?? null,
      )
    },
  },
  {
    method: 'PUT',
    path: '/api/orders/:id/internal-note',
    handler: ({ params, body }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      const { note } = (body ?? {}) as { note?: string }
      const value: OrderInternalNote = {
        note: note ?? '',
        authorName: REVIEWER_NAME,
        updatedAt: new Date().toISOString(),
      }
      internalNotes[order.code] = value
      return ok(value)
    },
  },
  {
    method: 'POST',
    path: '/api/orders/:id/approve',
    handler: ({ params }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      if (order.status !== 'PENDING') {
        return fail(
          409,
          'ORDER_NOT_UNDER_REVIEW',
          'Đơn không còn ở trạng thái chờ duyệt.',
        )
      }
      order.status = 'APPROVED'
      missions.push(newMinimalMission(order.id, order.code))
      return ok(undefined, 'Order approved and mission created successfully')
    },
  },
  {
    method: 'POST',
    path: '/api/orders/:id/approval',
    handler: ({ params, body }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      const { decision, reason } = (body ?? {}) as {
        decision?: ApprovalDecision
        reason?: string
      }
      if (!reason || !reason.trim()) {
        return fail(400, 'VALIDATION_ERROR', 'Yêu cầu nhập lý do', {
          reason: 'Lý do là bắt buộc',
        })
      }
      if (decision !== 'REJECTED' && decision !== 'NEED_INFO') {
        return fail(400, 'VALIDATION_ERROR', 'decision không hợp lệ', {
          decision: 'decision phải là REJECTED hoặc NEED_INFO',
        })
      }
      if (order.status !== 'PENDING') {
        return fail(
          409,
          'ORDER_NOT_UNDER_REVIEW',
          'Đơn không còn ở trạng thái chờ duyệt.',
        )
      }

      approvals.push({
        orderId: order.id,
        decision,
        reason,
        reviewerId: REVIEWER_ID,
        decidedAt: new Date().toISOString(),
      })

      if (decision === 'REJECTED') {
        order.status = 'REJECTED'
      }
      // NEED_INFO: backend OrderStatus has no matching value (conflict,
      // documented in evd/P4-manager-order-review.md) — order stays PENDING,
      // the queue query above filters it out via latestApprovalFor().

      return ok(undefined, 'Đã ghi nhận quyết định')
    },
  },
  {
    // PROPOSED (P5) — see OrderMissionBrief doc in
    // features/manager/types/orders.ts for why GET /api/orders/:id can't
    // serve CreateMissionPage (it 409s once the order leaves PENDING).
    method: 'GET',
    path: '/api/orders/:id/mission-brief',
    handler: ({ params }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      if (order.status !== 'APPROVED') {
        return fail(
          409,
          'ORDER_NOT_APPROVED',
          'Đơn chưa được duyệt, chưa thể tạo mission.',
        )
      }
      return ok({
        id: order.id,
        code: order.code,
        serviceName: order.serviceName,
        customerFullName: order.customer.fullName,
        preferredDate: order.preferredDate,
        preferredTimeName: order.preferredTimeName,
        addressText: order.addressText,
        center: order.center,
        radiusM: order.radiusM,
        nearestBase: order.nearestBase,
        mediaRequirements: order.mediaRequirements,
      })
    },
  },
  // ── MNG-11: POST /api/orders/:id/deliver [BRIEF C4] ──────────────────
  {
    method: 'POST',
    path: '/api/orders/:id/deliver',
    handler: ({ params, body }) => {
      const order = findOrder(params.id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      if (order.status !== 'COMPLETED' && order.status !== 'IN_PROGRESS') {
        return fail(
          409,
          'ORDER_NOT_DELIVERABLE',
          'Đơn chưa hoàn thành, chưa thể giao kết quả.',
        )
      }
      const b = body as { deliveryNote?: string } | null
      order.status = 'COMPLETED'
      return ok({
        id: order.id,
        code: order.code,
        status: order.status,
        deliveryNote: b?.deliveryNote ?? null,
        deliveredAt: new Date().toISOString(),
      })
    },
  },
])

/** Test-only escape hatch to assert on the in-memory mock collections. */
export const __testing = { missions, approvals }
