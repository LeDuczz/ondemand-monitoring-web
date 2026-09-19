// Mock handlers for the MNG-02 (order queue) and MNG-03 (order review) APIs.
// Endpoints, per evd/00-PLAN.md §3 and the P4 task brief:
//   GET  /api/orders?status=PENDING          [TK path; BE OrderStatus value]
//   GET  /api/orders/{id}                    [TK]
//   GET  /api/orders/{id}/analysis/latest    [BRIEF C4]
import type { AiVerdict, OrderStatus } from '../../shared/types/domain'
import type {
  OrderAnalysis,
  OrderDetail,
  OrderQueueItem,
} from '../../features/manager/types/orders'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import ordersSeed from '../data/orders.json'
import analysesSeed from '../data/order-analyses.json'

type SeedOrder = {
  id: string
  code: string
  status: OrderStatus
  customer: {
    fullName: string
    companyName: string
    email: string
    phone: string
  }
  serviceName: string
  preferredDate: string
  preferredTimeName: string
  preferredWindow: string
  submittedAt: string
  addressText: string
  center: { lat: number; lon: number }
  radiusM: number
  nearestBase: string
  mediaRequirements: { label: string }[]
  purpose: string
  attachments: {
    name: string
    sizeLabel: string
    mimeType: string
    url: string
  }[]
  aiVerdict: AiVerdict
  blockerCount: number
  warningCount: number
}

// Each collection is created from the exact object/array we hold a
// reference to (not a nested property read off a bigger createCollection()
// result) — `createCollection`'s reset only keeps identity for the value it
// was given directly (arrays are spliced in place; objects have their keys
// replaced in place). Reading `createCollection(seed).nested` instead would
// leave `nested` pointing at the pre-reset value forever.
const orders = createCollection(ordersSeed.orders) as SeedOrder[]
const analyses = createCollection(analysesSeed.analyses) as unknown as Record<
  string,
  OrderAnalysis
>

function findOrder(id: string): SeedOrder | undefined {
  return orders.find((o) => o.id === id || o.code === id)
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
      const rows = orders.filter((o) => o.status === 'PENDING').map(toQueueItem)
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
      const fallback: OrderAnalysis = {
        overallVerdict: order.aiVerdict,
        blockerCount: order.blockerCount,
        warningCount: order.warningCount,
        ruleEngineMs: 0,
        createdAt: order.submittedAt,
        llmSummary: '',
        findings: [],
      }
      return ok(fallback)
    },
  },
])
