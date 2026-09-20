// Mock handlers for customer-facing order APIs:
//   GET  /api/customer/dashboard
//   GET  /api/customer/orders[?status=]
//   GET  /api/customer/orders/:id
//   POST /api/customer/orders
//   POST /api/customer/orders/:id/cancel
import type { OrderStatus } from '../../shared/types/domain'
import type {
  CustomerDashboard,
  CustomerOrderDetail,
  CustomerOrderItem,
} from '../../features/customer/types/orders'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import seed from '../data/customer-orders.json'

type SeedOrder = (typeof seed.orders)[number]

const orders = createCollection(
  seed.orders as SeedOrder[],
) as unknown as SeedOrder[]

function toItem(o: SeedOrder): CustomerOrderItem {
  return {
    id: o.id,
    orderCode: o.orderCode,
    title: o.title,
    addressText: o.addressText,
    preferredDate: o.preferredDate,
    status: o.status as OrderStatus,
    serviceNames: o.serviceNames,
    missionCount: o.missionCount,
    hasNewMedia: o.hasNewMedia,
    submittedAt: o.submittedAt,
  }
}

function toDetail(o: SeedOrder): CustomerOrderDetail {
  return {
    id: o.id,
    orderCode: o.orderCode,
    title: o.title,
    purpose: o.purpose,
    description: o.description,
    addressText: o.addressText,
    centerLat: o.centerLat,
    centerLon: o.centerLon,
    radiusM: o.radiusM,
    preferredDate: o.preferredDate,
    preferredTimeName: o.preferredTimeName,
    status: o.status as OrderStatus,
    serviceNames: o.serviceNames,
    submittedAt: o.submittedAt,
    approvalDecision: o.approvalDecision as CustomerOrderDetail['approvalDecision'],
    approvalReason: o.approvalReason,
    approvalAt: o.approvalAt,
    missions: o.missions.map((m) => ({
      id: m.id,
      missionCode: m.missionCode,
      attemptNumber: m.attemptNumber,
      status: m.status as CustomerOrderDetail['missions'][number]['status'],
      scheduledStartAt: m.scheduledStartAt,
      scheduledEndAt: m.scheduledEndAt,
      hasLive: m.hasLive,
      mediaCount: m.mediaCount,
    })),
  }
}

function buildDashboard(): CustomerDashboard {
  const pending = orders.filter((o) => o.status === 'PENDING').length
  const inProg = orders.filter((o) => o.status === 'IN_PROGRESS').length
  const completed = orders.filter((o) => o.status === 'COMPLETED').length
  const newMedia = orders.filter((o) => o.hasNewMedia).length
  const recent = [...orders]
    .sort(
      (a, b) =>
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    )
    .slice(0, 5)
    .map(toItem)

  return {
    pendingCount: pending,
    inProgressCount: inProg,
    completedCount: completed,
    newMediaCount: newMedia,
    recentOrders: recent,
  }
}

registerMockRoutes([
  // CUS-01 dashboard
  {
    method: 'GET',
    path: '/api/customer/dashboard',
    handler: () => ok(buildDashboard()),
  },

  // CUS-04 order list
  {
    method: 'GET',
    path: '/api/customer/orders',
    handler: ({ query }) => {
      const status = query.get('status')
      const filtered = status
        ? orders.filter((o) => o.status === status)
        : orders
      const items = [...filtered]
        .sort(
          (a, b) =>
            new Date(b.submittedAt).getTime() -
            new Date(a.submittedAt).getTime(),
        )
        .map(toItem)
      return ok({ items })
    },
  },

  // CUS-02 create order
  {
    method: 'POST',
    path: '/api/customer/orders',
    handler: ({ body }) => {
      const payload = body as {
        title?: string
        addressText?: string
        serviceId?: string
        preferredDate?: string
        preferredTimeName?: string
        centerLat?: number
        centerLon?: number
        radiusM?: number
      }
      if (!payload.title?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Tiêu đề là bắt buộc.', {
          title: 'Bắt buộc',
        })
      if (!payload.preferredDate)
        return fail(400, 'VALIDATION_ERROR', 'Ngày là bắt buộc.', {
          preferredDate: 'Bắt buộc',
        })

      const now = new Date().toISOString()
      const seq = String(orders.length + 1).padStart(3, '0')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newOrder = {
        id: `cus-ord-new-${seq}`,
        orderCode: `ORD-CUS-NEW-${seq}`,
        customerId: seed.customerId,
        title: payload.title,
        purpose: null,
        description: null,
        addressText: payload.addressText ?? null,
        centerLat: payload.centerLat ?? null,
        centerLon: payload.centerLon ?? null,
        radiusM: payload.radiusM ?? null,
        preferredDate: payload.preferredDate,
        preferredTimeName: payload.preferredTimeName ?? null,
        status: 'PENDING',
        serviceNames: [],
        missionCount: 0,
        hasNewMedia: false,
        submittedAt: now,
        approvalDecision: null,
        approvalReason: null,
        approvalAt: null,
        missions: [],
      } as unknown as SeedOrder
      orders.push(newOrder)
      return ok(toDetail(newOrder))
    },
  },

  // CUS-05 order detail
  {
    method: 'GET',
    path: '/api/customer/orders/:id',
    handler: ({ params }) => {
      const { id } = params
      const order = orders.find((o) => o.id === id || o.orderCode === id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.')
      return ok(toDetail(order))
    },
  },

  // Cancel order
  {
    method: 'POST',
    path: '/api/customer/orders/:id/cancel',
    handler: ({ params }) => {
      const { id } = params
      const order = orders.find((o) => o.id === id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.')
      const cancellable: OrderStatus[] = ['PENDING', 'APPROVED']
      if (!cancellable.includes(order.status as OrderStatus))
        return fail(
          409,
          'CANNOT_CANCEL',
          'Không thể huỷ đơn ở trạng thái này.',
        )
      order.status = 'CANCELLED'
      return ok(toDetail(order))
    },
  },
])
