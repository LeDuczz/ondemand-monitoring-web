import type { OrderStatus } from '../../../../shared/types/domain'
import type { ChecklistSnapshot } from '../checklist/types'

/** One row of `GET /api/orders/mine`, flattened for the list and dashboard. */
export type OrderRow = {
  id: string
  /** Short display code derived from the (uuid) id. */
  code: string
  title: string
  address: string | null
  dateFrom: string | null
  dateTo: string | null
  timeId: string | null
  timeName: string | null
  serviceId: string | null
  serviceName: string | null
  status: OrderStatus
  radiusM: number | null
  createdAt: string | null
}

export type DeliverableView = {
  id: string
  name: string
  format: string | null
  /** Scalar requirement entries (key, display value) worth showing. */
  requirements: Array<{ key: string; value: string }>
  aiAnalysisRequested: boolean
}

export type OrderTimelineEvent = {
  kind: 'created' | 'approved' | 'rejected' | 'status'
  at: string
  status?: OrderStatus
  actor: string | null
  note: string | null
}

/** `GET /api/orders/{id}` mapped for the detail page. */
export type OrderDetailView = OrderRow & {
  checklistItems?: ChecklistSnapshot[]
  checklistSnapshotAt?: string | null
  description: string | null
  latitude: number | null
  longitude: number | null
  rejectReason: string | null
  reviewByName: string | null
  reviewAt: string | null
  updatedAt: string | null
  deliverables: DeliverableView[]
  timeline: OrderTimelineEvent[]
  /** BE has no cancel endpoint; the mock allows it while the order is PENDING. */
  canCancel: boolean
}

export type OrderStats = {
  total: number
  pending: number
  approved: number
  inProgress: number
  completed: number
  rejected: number
  cancelled: number
}
