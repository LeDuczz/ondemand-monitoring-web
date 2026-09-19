// Mock handlers for the MNG-02 (order queue) and MNG-03 (order review) APIs.
// Endpoints, per evd/00-PLAN.md §3 and the P4 task brief:
//   GET  /api/orders?status=PENDING          [TK path; BE OrderStatus value]
import type { AiVerdict, OrderStatus } from '../../shared/types/domain'
import type { OrderQueueItem } from '../../features/manager/types/orders'
import { createCollection } from '../db'
import { ok, registerMockRoutes } from '../mockServer'
import ordersSeed from '../data/orders.json'

type SeedOrder = {
  id: string
  code: string
  status: OrderStatus
  customer: {
    fullName: string
    companyName: string
  }
  serviceName: string
  preferredDate: string
  preferredTimeName: string
  submittedAt: string
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
      const rows = orders.filter((o) => o.status === 'PENDING').map(toQueueItem)
      return ok(rows)
    },
  },
])
