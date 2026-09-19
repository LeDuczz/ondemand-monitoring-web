// Types for MNG-02 (order approval queue) and MNG-03 (order review).
// Field names follow [BE] `OrderCreateResponse` DTO (camelCase) where they
// overlap; fields only described in [BRIEF]/[TK] are added alongside and
// marked in comments. Enums come from `shared/types/domain.ts` (backend
// truth) plus `AiVerdict`/`FindingSeverity` (brief A4).
import type { AiVerdict } from '../../../shared/types/domain'

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
