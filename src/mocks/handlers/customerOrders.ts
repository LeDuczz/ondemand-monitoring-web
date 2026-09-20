// Mock handlers for customer-facing order APIs:
//   GET  /api/customer/dashboard
//   GET  /api/customer/orders[?status=&serviceId=]
//   GET  /api/customer/orders/:id
//   POST /api/customer/orders
//   PATCH /api/customer/orders/:id/draft
//   POST /api/customer/orders/:id/cancel
//   POST /api/customer/orders/:id/submit
//   GET  /api/customer/orders/:id/analysis
//   POST /api/customer/orders/:id/analysis/findings/:fid/apply
//   POST /api/customer/orders/:id/analysis/findings/:fid/ignore
//   GET  /api/customer/media
//   GET  /api/customer/media/:id
import type { AiVerdict, OrderStatus } from '../../shared/types/domain'
import type {
  AiAnalysisResult,
  CustomerDashboard,
  CustomerOrderDetail,
  CustomerOrderItem,
  MediaDetail,
  MediaLibrary,
} from '../../features/customer/types/orders'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import seed from '../data/customer-orders.json'

type SeedOrder = (typeof seed.orders)[number]
type SeedMedia = (typeof seed.media)['msn-006-1'][number]

const orders = createCollection(seed.orders as SeedOrder[]) as unknown as SeedOrder[]

// Flatten all media from all missions
const allMedia: SeedMedia[] = Object.values(seed.media).flat() as SeedMedia[]

// ── Mappers ────────────────────────────────────────────────

function toItem(o: SeedOrder): CustomerOrderItem {
  return {
    id: o.id,
    orderCode: o.orderCode,
    title: o.title,
    addressText: o.addressText,
    preferredDate: o.preferredDate,
    preferredTimeLabel: o.preferredTimeName ?? null,
    radiusM: o.radiusM ?? null,
    status: o.status as OrderStatus,
    serviceNames: o.serviceNames,
    missionCount: o.missionCount,
    hasNewMedia: o.hasNewMedia,
    submittedAt: o.submittedAt,
    canCancel: o.canCancel,
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
    approvalActorName: o.approvalActorName,
    statusHistory: (o.statusHistory ?? []).map((e) => ({
      status: e.status as OrderStatus,
      at: e.at,
      actorName: e.actorName,
      note: e.note,
    })),
    aiSummary: o.aiSummary
      ? {
          verdict: o.aiSummary.verdict as AiVerdict,
          warningCount: o.aiSummary.warningCount,
          blockerCount: o.aiSummary.blockerCount,
        }
      : null,
    missions: o.missions.map((m) => ({
      id: m.id,
      missionCode: m.missionCode,
      attemptNumber: m.attemptNumber,
      status: m.status as CustomerOrderDetail['missions'][number]['status'],
      scheduledStartAt: m.scheduledStartAt,
      scheduledEndAt: m.scheduledEndAt,
      hasLive: m.hasLive,
      mediaCount: m.mediaCount,
      failureReason: m.failureReason,
    })),
    canCancel: o.canCancel,
  }
}

function buildDashboard(): CustomerDashboard {
  const pending = orders.filter((o) => o.status === 'PENDING').length
  const inProg = orders.filter((o) => o.status === 'IN_PROGRESS').length
  const completed = orders.filter((o) => o.status === 'COMPLETED').length
  const newMedia = orders.filter((o) => o.hasNewMedia).length

  // Sort by submittedAt descending, null submittedAt goes to end
  const recent = [...orders]
    .sort((a, b) => {
      if (!a.submittedAt && !b.submittedAt) return 0
      if (!a.submittedAt) return 1
      if (!b.submittedAt) return -1
      return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    })
    .slice(0, 5)
    .map(toItem)

  // Find any order that currently has IN_FLIGHT mission
  const liveOrder = orders.find(
    (o) => o.status === 'IN_PROGRESS' && o.missions.some((m) => m.hasLive),
  )
  const liveMission = liveOrder?.missions.find((m) => m.hasLive) ?? null

  return {
    pendingCount: pending,
    inProgressCount: inProg,
    completedCount: completed,
    newMediaCount: newMedia,
    recentOrders: recent,
    activeLiveMission: liveMission && liveOrder
      ? {
          orderId: liveOrder.id,
          orderCode: liveOrder.orderCode,
          orderTitle: liveOrder.title,
          missionCode: liveMission.missionCode,
          durationSec: 1847,
          viewerCount: 3,
        }
      : null,
  }
}

// ── Handlers ───────────────────────────────────────────────

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
      const serviceId = query.get('serviceId')
      let filtered = [...orders]
      if (status) filtered = filtered.filter((o) => o.status === status)
      if (serviceId)
        filtered = filtered.filter((o) =>
          (o.serviceIds as string[]).includes(serviceId),
        )
      const items = filtered
        .sort((a, b) => {
          if (!a.submittedAt && !b.submittedAt) return 0
          if (!a.submittedAt) return 1
          if (!b.submittedAt) return -1
          return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
        })
        .map(toItem)
      return ok({ items })
    },
  },

  // CUS-02 create order (creates as DRAFT then triggers AI analysis)
  {
    method: 'POST',
    path: '/api/customer/orders',
    handler: ({ body }) => {
      const payload = body as {
        title?: string
        purpose?: string
        description?: string
        serviceIds?: string[]
        addressText?: string
        centerLat?: number
        centerLon?: number
        radiusM?: number
        preferredDate?: string
        preferredTimeName?: string
      }
      if (!payload.title?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Tiêu đề là bắt buộc.', { title: 'Bắt buộc' })
      if (!payload.preferredDate)
        return fail(400, 'VALIDATION_ERROR', 'Ngày là bắt buộc.', { preferredDate: 'Bắt buộc' })

      const now = new Date().toISOString()
      const seq = String(orders.length + 1).padStart(3, '0')
      const newOrder = {
        id: `cus-ord-new-${seq}`,
        orderCode: `ORD-NEW-${seq}`,
        customerId: seed.customerId,
        title: payload.title,
        purpose: payload.purpose ?? null,
        description: payload.description ?? null,
        addressText: payload.addressText ?? null,
        centerLat: payload.centerLat ?? null,
        centerLon: payload.centerLon ?? null,
        radiusM: payload.radiusM ?? null,
        preferredDate: payload.preferredDate,
        preferredTimeName: payload.preferredTimeName ?? null,
        status: 'DRAFT',
        serviceNames: [],
        serviceIds: payload.serviceIds ?? [],
        missionCount: 0,
        hasNewMedia: false,
        submittedAt: null,
        approvalDecision: null,
        approvalReason: null,
        approvalAt: null,
        approvalActorName: null,
        canCancel: false,
        statusHistory: [{ status: 'DRAFT', at: now, actorName: null, note: 'Tạo nháp' }],
        aiSummary: null,
        missions: [],
      } as unknown as SeedOrder
      orders.push(newOrder)
      return ok(toDetail(newOrder))
    },
  },

  // PATCH draft — save draft without submitting
  {
    method: 'PATCH',
    path: '/api/customer/orders/:id/draft',
    handler: ({ params, body }) => {
      const { id } = params
      const order = orders.find((o) => o.id === id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.')
      if (order.status !== 'DRAFT')
        return fail(409, 'INVALID_STATE', 'Chỉ có thể lưu nháp khi đơn ở trạng thái DRAFT.')
      const patch = body as Partial<SeedOrder>
      Object.assign(order, patch)
      return ok(toDetail(order))
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

  // CUS-03 cancel order
  {
    method: 'POST',
    path: '/api/customer/orders/:id/cancel',
    handler: ({ params }) => {
      const { id } = params
      const order = orders.find((o) => o.id === id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.')
      const cancellable: OrderStatus[] = ['SUBMITTED', 'PENDING', 'APPROVED', 'SCHEDULED']
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
      return ok(toDetail(order))
    },
  },

  // CUS-03 submit order (DRAFT/AI_ANALYZED → SUBMITTED)
  {
    method: 'POST',
    path: '/api/customer/orders/:id/submit',
    handler: ({ params }) => {
      const { id } = params
      const order = orders.find((o) => o.id === id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.')
      const submittable: OrderStatus[] = ['DRAFT', 'AI_ANALYZED']
      if (!submittable.includes(order.status as OrderStatus))
        return fail(409, 'INVALID_STATE', 'Không thể gửi duyệt đơn ở trạng thái này.')
      const now = new Date().toISOString()
      order.status = 'SUBMITTED'
      order.submittedAt = now
      order.canCancel = true
      ;(order.statusHistory as unknown[]).push({
        status: 'SUBMITTED',
        at: now,
        actorName: null,
        note: null,
      })
      return ok(toDetail(order))
    },
  },

  // CUS-03 AI analysis
  {
    method: 'GET',
    path: '/api/customer/orders/:id/analysis',
    handler: ({ params }) => {
      const { id } = params
      const order = orders.find((o) => o.id === id)
      if (!order) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn hàng.')
      const analysis = (seed.aiAnalyses as unknown as Record<string, AiAnalysisResult>)[id]
      if (!analysis) return fail(404, 'NO_ANALYSIS', 'Chưa có kết quả phân tích AI cho đơn này.')
      return ok(analysis)
    },
  },

  // CUS-03 apply finding suggestion
  {
    method: 'POST',
    path: '/api/customer/orders/:id/analysis/findings/:fid/apply',
    handler: ({ params }) => {
      const { id, fid } = params
      const analysis = (seed.aiAnalyses as unknown as Record<string, AiAnalysisResult>)[id]
      if (!analysis) return fail(404, 'NOT_FOUND', 'Không tìm thấy phân tích.')
      const finding = analysis.findings.find((f) => f.id === fid)
      if (!finding) return fail(404, 'NOT_FOUND', 'Không tìm thấy finding.')
      finding.suggestionState = 'ACCEPTED'
      return ok(analysis)
    },
  },

  // CUS-03 ignore finding
  {
    method: 'POST',
    path: '/api/customer/orders/:id/analysis/findings/:fid/ignore',
    handler: ({ params }) => {
      const { id, fid } = params
      const analysis = (seed.aiAnalyses as unknown as Record<string, AiAnalysisResult>)[id]
      if (!analysis) return fail(404, 'NOT_FOUND', 'Không tìm thấy phân tích.')
      const finding = analysis.findings.find((f) => f.id === fid)
      if (!finding) return fail(404, 'NOT_FOUND', 'Không tìm thấy finding.')
      finding.suggestionState = 'IGNORED'
      return ok(analysis)
    },
  },

  // CUS-07 media library
  {
    method: 'GET',
    path: '/api/customer/media',
    handler: () => {
      const missionMap = new Map<
        string,
        {
          missionId: string
          missionCode: string
          orderId: string
          orderCode: string
          orderTitle: string
          photoCount: number
          videoCount: number
        }
      >()

      for (const m of allMedia) {
        if (!missionMap.has(m.missionId)) {
          const order = orders.find((o) => o.id === m.orderId)
          missionMap.set(m.missionId, {
            missionId: m.missionId,
            missionCode: m.missionCode,
            orderId: m.orderId,
            orderCode: m.orderCode,
            orderTitle: order?.title ?? m.orderCode,
            photoCount: 0,
            videoCount: 0,
          })
        }
        const entry = missionMap.get(m.missionId)!
        if (m.mediaType === 'PHOTO') entry.photoCount++
        else if (m.mediaType === 'VIDEO') entry.videoCount++
      }

      const result: MediaLibrary = {
        missions: Array.from(missionMap.values()),
        assets: allMedia.map((m) => ({
          id: m.id,
          missionId: m.missionId,
          missionCode: m.missionCode,
          orderCode: m.orderCode,
          mediaType: m.mediaType as 'PHOTO' | 'VIDEO',
          capturedAt: m.capturedAt,
          fileSizeBytes: m.fileSizeBytes,
          widthPx: m.widthPx,
          heightPx: m.heightPx,
          durationSec: m.durationSec,
          mediaStatus: m.mediaStatus as 'AVAILABLE',
          thumbnailUrl: m.thumbnailUrl,
          isNew: m.isNew,
        })),
      }
      return ok(result)
    },
  },

  // CUS-08 media detail
  {
    method: 'GET',
    path: '/api/customer/media/:id',
    handler: ({ params }) => {
      const { id } = params
      const idx = allMedia.findIndex((m) => m.id === id)
      if (idx === -1) return fail(404, 'NOT_FOUND', 'Không tìm thấy media.')
      const asset = allMedia[idx]

      // Provide adjacent media IDs from same mission
      const missionMedia = allMedia.filter((m) => m.missionId === asset.missionId)
      const mIdx = missionMedia.findIndex((m) => m.id === id)

      const result: MediaDetail = {
        asset: {
          id: asset.id,
          missionId: asset.missionId,
          missionCode: asset.missionCode,
          orderCode: asset.orderCode,
          mediaType: asset.mediaType as 'PHOTO' | 'VIDEO',
          capturedAt: asset.capturedAt,
          fileSizeBytes: asset.fileSizeBytes,
          widthPx: asset.widthPx,
          heightPx: asset.heightPx,
          durationSec: asset.durationSec,
          mediaStatus: asset.mediaStatus as 'AVAILABLE',
          thumbnailUrl: asset.thumbnailUrl,
          isNew: asset.isNew,
        },
        downloadUrl: `https://mock-storage.example/media/${asset.id}?token=mock-token`,
        urlExpiredAt: new Date(Date.now() + 3600 * 1000).toISOString(),
        prevMediaId: mIdx > 0 ? missionMedia[mIdx - 1].id : null,
        nextMediaId: mIdx < missionMedia.length - 1 ? missionMedia[mIdx + 1].id : null,
      }
      return ok(result)
    },
  },
])
