import type { AiVerdict, FindingSeverity, MediaStatus, MissionStatus, OrderStatus } from '../../../shared/types/domain'

/** One row in `GET /api/customer/orders` list */
export type CustomerOrderItem = {
  id: string
  orderCode: string
  title: string
  addressText: string | null
  preferredDate: string
  preferredTimeLabel: string | null
  radiusM: number | null
  status: OrderStatus
  serviceNames: string[]
  missionCount: number
  hasNewMedia: boolean
  submittedAt: string | null
  canCancel: boolean
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
  failureReason: string | null
}

/** One entry in order status history */
export type OrderStatusEvent = {
  status: OrderStatus
  at: string
  actorName: string | null
  note: string | null
}

/** AI analysis finding from CUS-03 */
export type AiFinding = {
  id: string
  severity: FindingSeverity
  ruleCode: string
  fieldRef: string | null
  message: string
  evidence: Record<string, string>
  suggestionLabel: string | null
  suggestionState: 'PENDING' | 'ACCEPTED' | 'IGNORED' | null
}

/** Full AI analysis result for CUS-03 */
export type AiAnalysisResult = {
  orderId: string
  verdict: AiVerdict
  blockerCount: number
  warningCount: number
  infoCount: number
  findings: AiFinding[]
  analyzedAt: string
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
  submittedAt: string | null
  approvalDecision: 'APPROVED' | 'REJECTED' | null
  approvalReason: string | null
  approvalAt: string | null
  approvalActorName: string | null
  statusHistory: OrderStatusEvent[]
  missions: OrderMissionSummary[]
  aiSummary: { verdict: AiVerdict; warningCount: number; blockerCount: number } | null
  canCancel: boolean
}

/** `GET /api/customer/dashboard` stats for CUS-01 */
export type CustomerDashboard = {
  pendingCount: number
  inProgressCount: number
  completedCount: number
  newMediaCount: number
  recentOrders: CustomerOrderItem[]
  activeLiveMission: {
    orderId: string
    orderCode: string
    orderTitle: string
    missionCode: string
    durationSec: number
    viewerCount: number
  } | null
}

/** Media asset in library (CUS-07) */
export type MediaAsset = {
  id: string
  missionId: string
  missionCode: string
  orderCode: string
  mediaType: 'PHOTO' | 'VIDEO'
  capturedAt: string
  fileSizeBytes: number
  widthPx: number | null
  heightPx: number | null
  durationSec: number | null
  mediaStatus: MediaStatus
  thumbnailUrl: string | null
  isNew: boolean
}

/** Media library response */
export type MediaLibrary = {
  missions: Array<{
    missionId: string
    missionCode: string
    orderId: string
    orderCode: string
    orderTitle: string
    photoCount: number
    videoCount: number
  }>
  assets: MediaAsset[]
}

/** Full media detail with presigned URL (CUS-08) */
export type MediaDetail = {
  asset: MediaAsset
  downloadUrl: string | null
  urlExpiredAt: string | null
  prevMediaId: string | null
  nextMediaId: string | null
}
