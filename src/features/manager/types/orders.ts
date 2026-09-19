// Types for MNG-02 (order approval queue) and MNG-03 (order review).
// Field names follow [BE] `OrderCreateResponse` DTO (camelCase) where they
// overlap; fields only described in [BRIEF]/[TK] are added alongside and
// marked in comments. Enums come from `shared/types/domain.ts` (backend
// truth) plus `AiVerdict`/`FindingSeverity` (brief A4).
import type { AiVerdict, OrderStatus } from '../../../shared/types/domain'

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

export type OrderCustomerContact = OrderCustomerSummary & {
  email: string
  phone: string
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

/** `GET /api/orders/{id}` [TK] full order detail for MNG-03. */
export type OrderDetail = {
  id: string
  code: string
  status: OrderStatus
  customer: OrderCustomerContact
  serviceName: string
  preferredDate: string
  preferredTimeName: string
  preferredWindow: string
  submittedAt: string
  // Location Info — brief-only fields (radiusM, nearestBase, center) needed
  // for the MNG-03 map/detail card, not part of OrderCreateResponse.
  addressText: string
  center: { lat: number; lon: number }
  radiusM: number
  nearestBase: string
  mediaRequirements: OrderMediaRequirement[]
  purpose: string
  attachments: OrderAttachment[]
}
