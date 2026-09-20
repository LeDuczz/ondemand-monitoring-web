import type { MissionStatus, OrderStatus } from '../../../shared/types/domain'

/** One row in `GET /api/customer/orders` list */
export type CustomerOrderItem = {
  id: string
  orderCode: string
  title: string
  addressText: string | null
  preferredDate: string
  status: OrderStatus
  serviceNames: string[]
  missionCount: number
  hasNewMedia: boolean
  submittedAt: string
}

/** Mission summary shown inside order detail */
export type OrderMissionSummary = {
  id: string
  missionCode: string
  attemptNumber: number
  status: MissionStatus
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  hasLive: boolean
  mediaCount: number
}

/** `GET /api/customer/orders/{id}` full detail for CUS-05 */
export type CustomerOrderDetail = {
  id: string
  orderCode: string
  title: string
  purpose: string | null
  description: string | null
  addressText: string | null
  centerLat: number | null
  centerLon: number | null
  radiusM: number | null
  preferredDate: string
  preferredTimeName: string | null
  status: OrderStatus
  serviceNames: string[]
  submittedAt: string
  approvalDecision: 'APPROVED' | 'REJECTED' | null
  approvalReason: string | null
  approvalAt: string | null
  missions: OrderMissionSummary[]
}

/** `GET /api/customer/dashboard` stats for CUS-01 */
export type CustomerDashboard = {
  pendingCount: number
  inProgressCount: number
  completedCount: number
  newMediaCount: number
  recentOrders: CustomerOrderItem[]
}
