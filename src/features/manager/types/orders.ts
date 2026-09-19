// Types for MNG-02 (order approval queue) and MNG-03 (order review).
// Field names follow [BE] `OrderCreateResponse` DTO (camelCase) where they
// overlap; fields only described in [BRIEF]/[TK] are added alongside and
// marked in comments. Enums come from `shared/types/domain.ts` (backend
// truth) plus `AiVerdict`/`FindingSeverity` (brief A4).
import type {
  AiVerdict,
  FindingSeverity,
  OrderStatus,
} from '../../../shared/types/domain'

export type OrderCustomerSummary = {
  fullName: string
  companyName: string
}

/** One row of `GET /api/orders?status=PENDING` [TK path; BE OrderStatus value]. */
export type OrderQueueItem = {
  id: string
  code: string
  customer: OrderCustomerSummary
  serviceName: string
  preferredDate: string
  preferredTimeName: string
  submittedAt: string
  aiVerdict: AiVerdict
  blockerCount: number
  warningCount: number
}

// Contact info has no source for orders the design never renders a detail
// screen for — null rather than invented when absent.
export type OrderCustomerContact = OrderCustomerSummary & {
  email: string | null
  phone: string | null
}

/** `order.media_requirements[]` item [BRIEF] — brief-only field. */
export type OrderMediaRequirement = {
  label: string
}

/** `order.attachments[]` item [BRIEF] — brief-only field. */
export type OrderAttachment = {
  name: string
  sizeLabel: string
  mimeType: string
  url: string
}

/**
 * `GET /api/orders/{id}` [TK] full order detail for MNG-03. Only
 * ORD-2609-0157/0160 have design-sourced detail content — every other order
 * gets `null` for the fields below rather than invented placeholder data;
 * `OrderReviewPage` renders an explicit "Chưa có dữ liệu" marker per block
 * when its field is `null`.
 */
export type OrderDetail = {
  id: string
  code: string
  status: OrderStatus
  customer: OrderCustomerContact
  serviceName: string
  preferredDate: string
  preferredTimeName: string
  /** Precise HH:MM window — only sourced for the design's own demo order. */
  preferredWindow: string | null
  submittedAt: string
  // Location Info — brief-only fields (radiusM, nearestBase, center) needed
  // for the MNG-03 map/detail card, not part of OrderCreateResponse. `null`
  // when the design has no location content for this order.
  addressText: string | null
  center: { lat: number; lon: number } | null
  radiusM: number | null
  nearestBase: string | null
  mediaRequirements: OrderMediaRequirement[] | null
  purpose: string | null
  attachments: OrderAttachment[] | null
}

export type FindingCustomerAction = 'ACCEPTED' | 'IGNORED' | 'AUTO_FIXED' | null

/** `ai_finding` row [BRIEF A4]. */
export type AnalysisFinding = {
  severity: FindingSeverity
  message: string
  evidence: Record<string, string>
  customerAction: FindingCustomerAction
}

/**
 * `GET /api/orders/{id}/analysis/latest` [BRIEF C4]. `overallVerdict`/
 * `blockerCount`/`warningCount` always come from the evidenced queue row;
 * `ruleEngineMs`/`createdAt`/`llmSummary` and `findings` are only populated
 * for orders with design-sourced analysis content (`null`/`[]` otherwise —
 * not invented).
 */
export type OrderAnalysis = {
  overallVerdict: AiVerdict
  blockerCount: number
  warningCount: number
  ruleEngineMs: number | null
  createdAt: string | null
  llmSummary: string | null
  findings: AnalysisFinding[]
}

export type ResourceCandidate = {
  name: string
  score: number
  /** km for drones, missions/week label for pilots — see `distanceLabel`. */
  distanceLabel: string
}

/**
 * `GET /api/orders/{id}/resource-preview` — PROPOSED, no endpoint found in
 * [BE]/[BRIEF]/[TK API table]; content ("Nguồn lực khả dụng · xem trước · chưa
 * phân công") only exists as rendered numbers in [TK MNG-03].
 */
export type OrderResourcePreview = {
  eligibleDroneCount: number
  eligiblePilotCount: number
  topDrones: ResourceCandidate[]
  topPilots: ResourceCandidate[]
}

/**
 * `PUT /api/orders/{id}/internal-note` — PROPOSED, brief lists the "Ghi chú
 * nội bộ" block [TK MNG-03] but no backing table/endpoint.
 */
export type OrderInternalNote = {
  note: string
  authorName: string
  updatedAt: string
}

/**
 * `GET /api/orders/{id}/mission-brief` — PROPOSED, added in P5. `GET
 * /api/orders/{id}` [TK] 409s once an order leaves PENDING (MNG-03's
 * "already processed" error state, by design), so it cannot serve
 * CreateMissionPage (MNG-04), which needs an already-APPROVED order's
 * address/media/schedule fields. This is a minimal read-only projection
 * scoped to APPROVED orders instead.
 */
export type OrderMissionBrief = {
  id: string
  code: string
  serviceName: string
  customerFullName: string
  preferredDate: string
  preferredTimeName: string
  addressText: string | null
  center: { lat: number; lon: number } | null
  radiusM: number | null
  nearestBase: string | null
  mediaRequirements: OrderMediaRequirement[] | null
}

export type ApprovalDecision = 'REJECTED' | 'NEED_INFO'

/** Body of `POST /api/orders/{id}/approval` [BRIEF C4]. */
export type ApprovalRequest = {
  decision: ApprovalDecision
  reason: string
}
