// Test-only vi.spyOn stubs for the customer endpoints that the real backend
// serves (so they no longer have mock routes): orders, mission history,
// mission report and media. Data is derived from the customer seed
// (`src/mocks/data/customer-orders.json`), never from a mock route.
import { vi } from 'vitest'

import seed from '../../../mocks/data/customer-orders.json'
import {
  customerAnalyses,
  findBeOrder,
  listBeOrders,
} from '../../../mocks/handlers/customerOrdersStore'
import { customerApi } from '../api/customerApi'
import { customerMediaApi } from '../api/customerMediaApi'
import {
  customerMissionHistoryApi,
  type CustomerMissionHistory,
} from '../api/customerMissionHistoryApi'
import {
  customerMissionReportApi,
  type CustomerMissionSummary,
} from '../api/customerMissionReportApi'
import type {
  CustomerMediaNotificationResponse,
  CustomerMediaResponse,
} from '../lib/media/types'

export const historyFixtures: CustomerMissionHistory[] = [
  {
    id: 'msn-006-1',
    missionCode: 'MSN-2609-0131-1',
    orderId: 'cus-ord-006',
    orderTitle: 'Kiểm tra tiến độ nhà xưởng KCN Hiệp Phước',
    address: 'KCN Hiệp Phước, H. Nhà Bè',
    status: 'COMPLETED',
    scheduledStartAt: '2026-09-09T13:00:00+07:00',
    startedAt: '2026-09-09T13:05:00+07:00',
    completedAt: '2026-09-09T13:48:00+07:00',
    description: 'Chụp ảnh toàn cảnh và cận cảnh khu B.',
  },
  {
    id: 'msn-009-1',
    missionCode: 'MSN-2609-0120-1',
    orderId: 'cus-ord-009',
    orderTitle: 'Tuần tra an ninh kho bãi Cát Lái',
    address: 'Cảng Cát Lái, TP. Thủ Đức',
    status: 'CANCELLED',
    scheduledStartAt: '2026-09-10T08:00:00+07:00',
    startedAt: null,
    completedAt: null,
    description: null,
  },
  {
    id: 'msn-004-1',
    missionCode: 'MSN-2609-0098-1',
    orderId: 'cus-ord-004',
    orderTitle: 'Bản đồ 2D khu đất dự án Long Hậu',
    address: 'Xã Long Hậu, H. Nhà Bè',
    status: 'FAILED',
    scheduledStartAt: '2026-09-06T13:00:00+07:00',
    startedAt: '2026-09-06T13:10:00+07:00',
    completedAt: null,
    description: 'Dừng do thời tiết xấu.',
  },
]

type SeedMedia = (typeof seed.media)['msn-006-1'][number]
const seedMedia = Object.values(seed.media).flat() as SeedMedia[]

function placeholder(label: string) {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420"><rect width="640" height="420" fill="#dbe7fb"/>' +
    `<text x="320" y="220" text-anchor="middle">${label}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function toMediaDto(m: SeedMedia, index: number): CustomerMediaResponse {
  const video = m.mediaType === 'VIDEO'
  const captured = new Date(m.capturedAt)
  return {
    mediaId: m.id,
    missionId: m.missionId,
    deviceId: 'dev-test-01',
    mediaType: video ? 'VIDEO' : 'IMAGE',
    fileName: `${m.missionCode}-${String(index + 1).padStart(3, '0')}.${video ? 'mp4' : 'jpg'}`,
    contentType: video ? 'video/mp4' : 'image/jpeg',
    fileSize: m.fileSizeBytes,
    capturedAt: m.capturedAt,
    availableAt: new Date(captured.getTime() + 5 * 60_000).toISOString(),
    downloadUrl: video
      ? `https://storage.example/media/${m.id}.mp4?token=test`
      : placeholder(m.id),
  }
}

export const availableMedia = seedMedia.map(toMediaDto)
const forMission = (missionId: string) =>
  availableMedia.filter((m) => m.missionId === missionId)

const PROCESSING: Record<string, { processingCount: number; rejectedCount: number }> = {
  'msn-004-1': { processingCount: 1, rejectedCount: 1 },
}

function pageOf<T>(all: T[], page: number, size: number) {
  const totalPages = Math.max(1, Math.ceil(all.length / size))
  return {
    items: all.slice(page * size, page * size + size),
    page,
    size,
    totalItems: all.length,
    totalPages,
    first: page === 0,
    last: page >= totalPages - 1,
  }
}

function missionSummaries(orderId: string): CustomerMissionSummary[] {
  return historyFixtures
    .filter((m) => m.orderId === orderId)
    .map((m) => ({
      missionId: m.id,
      orderId: m.orderId,
      missionCode: m.missionCode,
      scopeLabel: m.description,
      status: m.status,
      scheduledStartAt: m.scheduledStartAt,
      scheduledEndAt: m.scheduledEndAt ?? null,
      replacesMissionId: null,
      reportAvailable: false,
    }))
}

/** GET /api/orders/mine, /api/orders/{id}, /api/orders/{id}/analysis/latest. */
export function stubCustomerOrders() {
  vi.spyOn(customerApi, 'listMyOrders').mockImplementation(async (params = {}) =>
    listBeOrders().filter((o) => !params.status || o.orderStatus === params.status),
  )
  vi.spyOn(customerApi, 'getOrderById').mockImplementation(async (id: string) => {
    const found = findBeOrder(id)
    if (!found) throw new Error('Order not found')
    return found
  })
  vi.spyOn(customerApi, 'getLatestAnalysis').mockImplementation(
    async (id: string) =>
      (customerAnalyses[id] ?? null) as unknown as Awaited<
        ReturnType<typeof customerApi.getLatestAnalysis>
      >,
  )
}

/** GET /api/customer/mission-history[/{id}], /api/customer/missions/{id}/media-status. */
export function stubCustomerMissionHistory() {
  vi.spyOn(customerMissionHistoryApi, 'list').mockImplementation(async (page: number) =>
    pageOf(historyFixtures, page, 20),
  )
  vi.spyOn(customerMissionHistoryApi, 'get').mockImplementation(async (id: string) => {
    const found = historyFixtures.find((m) => m.id === id)
    if (!found) throw new Error('Mission not found')
    return found
  })
  vi.spyOn(customerMissionHistoryApi, 'mediaStatus').mockImplementation(
    async (id: string) => ({
      availableCount: forMission(id).length,
      processingCount: PROCESSING[id]?.processingCount ?? 0,
      rejectedCount: PROCESSING[id]?.rejectedCount ?? 0,
    }),
  )
}

/** GET /api/customer/orders/{id}/missions[/{missionId}/report]. */
export function stubCustomerMissionReport() {
  vi.spyOn(customerMissionReportApi, 'list').mockImplementation(async (orderId: string) => {
    if (!findBeOrder(orderId)) throw new Error('Order not found')
    return missionSummaries(orderId)
  })
  vi.spyOn(customerMissionReportApi, 'report').mockImplementation(
    async (orderId: string, missionId: string) => {
      const mission = missionSummaries(orderId).find((m) => m.missionId === missionId)
      if (!mission) throw new Error('Mission not found')
      return { mission, reportAvailable: false, result: null, checklistItems: [] }
    },
  )
}

/** GET /api/customer/available-media, media-notifications, missions/{id}/media, media/{id}/download. */
export function stubCustomerMedia() {
  vi.spyOn(customerMediaApi, 'listAvailable').mockImplementation(async () => availableMedia)
  vi.spyOn(customerMediaApi, 'listNotifications').mockImplementation(async () =>
    seedMedia
      .filter((m) => m.isNew)
      .map(
        (m): CustomerMediaNotificationResponse => ({
          notificationId: `ntf-${m.id}`,
          mediaId: m.id,
          missionId: m.missionId,
          eventType: 'CUSTOMER_MEDIA_AVAILABLE',
          createdAt: new Date(new Date(m.capturedAt).getTime() + 5 * 60_000).toISOString(),
        }),
      ),
  )
  vi.spyOn(customerMediaApi, 'listMissionMedia').mockImplementation(
    async (missionId: string, page: number, size = 12) =>
      pageOf(forMission(missionId), page, size),
  )
  vi.spyOn(customerMediaApi, 'getMissionMedia').mockImplementation(
    async (missionId: string, mediaId: string) => {
      const found = forMission(missionId).find((m) => m.mediaId === mediaId)
      if (!found) throw new Error('Media not found')
      return found
    },
  )
  vi.spyOn(customerMediaApi, 'getDownload').mockImplementation(async (mediaId: string) => {
    const found = availableMedia.find((m) => m.mediaId === mediaId)
    if (!found) throw new Error('Media not found')
    return found
  })
}

/** Stubs every customer endpoint the real backend serves. */
export function stubCustomerBe() {
  stubCustomerOrders()
  stubCustomerMissionHistory()
  stubCustomerMissionReport()
  stubCustomerMedia()
}
