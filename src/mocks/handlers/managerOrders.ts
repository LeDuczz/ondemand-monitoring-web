// Mock handlers for the MNG-02 (order queue) and MNG-03/MNG-11 APIs that the
// real backend does NOT serve. Everything the BE already exposes
// (GET /api/orders/{pending,approved,{id},{id}/analysis/latest,
// {id}/resource-preview}, POST /api/orders/{id}/approve|approval) was removed
// so those calls reach the real backend.
//   GET  /api/orders?status=PENDING          [TK path; BE OrderStatus value]
//   PUT  /api/orders/{id}/internal-note      PROPOSED (no source endpoint)
//   GET  /api/orders/{id}/mission-brief      PROPOSED (P5)
//   POST /api/orders/{id}/deliver            [BRIEF C4] mark as delivered
import type {
  OrderInternalNote,
  OrderQueueItem,
} from '../../features/manager/types/orders'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import analysesSeed from '../data/order-analyses.json'
import { findBeOrder } from './customerOrdersStore'
import { missions } from './missionsStore'
import { findOrder, orders, type SeedOrder } from './ordersStore'

const REVIEWER_NAME = 'Lê Thị Thanh Hằng'

// Created from the exact object we hold a reference to so `resetMockDb()`
// keeps identity (see db.ts).
const internalNotes = createCollection(
  analysesSeed.internalNotes,
) as unknown as Record<string, OrderInternalNote>


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
        .map(toQueueItem)
      return ok(rows)
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
    // PROPOSED (P5) — see OrderMissionBrief doc in
    // features/manager/types/orders.ts for why GET /api/orders/:id can't
    // serve CreateMissionPage (it 409s once the order leaves PENDING).
    method: 'GET',
    path: '/api/orders/:id/mission-brief',
    handler: ({ params }) => {
      const order = findOrder(params.id)
      if (order) {
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
          preferredDateFrom: order.preferredDateFrom ?? order.preferredDate,
          preferredDateTo: order.preferredDateTo ?? order.preferredDate,
          preferredTimeName: order.preferredTimeName,
          addressText: order.addressText,
          center: order.center,
          radiusM: order.radiusM,
          nearestBase: order.nearestBase,
          mediaRequirements: order.mediaRequirements,
        })
      }

      const beOrder = findBeOrder(params.id)
      if (!beOrder) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn')
      if (beOrder.orderStatus !== 'APPROVED') {
        return fail(
          409,
          'ORDER_NOT_APPROVED',
          'Đơn chưa được duyệt, chưa thể tạo mission.',
        )
      }
      return ok({
        id: beOrder.id,
        code: beOrder.id,
        serviceName: beOrder.serviceName,
        customerFullName: beOrder.customerName || beOrder.customerId,
        preferredDate: beOrder.preferredDateFrom,
        preferredDateFrom: beOrder.preferredDateFrom,
        preferredDateTo: beOrder.preferredDateTo,
        preferredTimeName: beOrder.preferredTimeName,
        addressText: beOrder.address ?? null,
        center:
          beOrder.latitude != null && beOrder.longitude != null
            ? { lat: beOrder.latitude, lon: beOrder.longitude }
            : null,
        radiusM: beOrder.radiusM ?? null,
        nearestBase: null,
        mediaRequirements: beOrder.deliverables?.map((item) => ({
          label: item.deliverableTypeName,
        })) ?? null,
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
export const __testing = { missions }
