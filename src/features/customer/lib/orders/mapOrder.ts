import { displayOrderCode } from '../../../../shared/lib/orderCode'
import type { OrderStatus } from '../../../../shared/types/domain'
import type {
  OrderCreateResponse,
  OrderDeliverableResponse,
} from '../../api/orderApi'
import type {
  DeliverableView,
  OrderDetailView,
  OrderRow,
  OrderTimelineEvent,
} from './types'

const KNOWN: readonly OrderStatus[] = [
  'PENDING',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
]

/** The BE always sends an enum value; anything unknown is treated as PENDING. */
export function normalizeStatus(value: string | null | undefined): OrderStatus {
  return KNOWN.includes(value as OrderStatus) ? (value as OrderStatus) : 'PENDING'
}

/** Orders are identified by uuid; show the first block as a short code. */
export function shortOrderCode(id: string): string {
  return id.length > 12 ? id.slice(0, 8).toUpperCase() : id
}

const orNull = <T,>(value: T | null | undefined): T | null => value ?? null

export function toOrderRow(order: OrderCreateResponse): OrderRow {
  const code = displayOrderCode(order.orderCode, order.id)
  return {
    id: order.id,
    code,
    title: order.title?.trim() || code,
    address: orNull(order.address),
    dateFrom: orNull(order.preferredDateFrom),
    dateTo: orNull(order.preferredDateTo),
    timeId: orNull(order.preferredTimeId),
    timeName: orNull(order.preferredTimeName),
    serviceId: orNull(order.serviceId),
    serviceName: orNull(order.serviceName),
    status: normalizeStatus(order.orderStatus),
    radiusM: orNull(order.radiusM),
    createdAt: orNull(order.createdAt),
  }
}

/** Requirement keys that are internal bookkeeping, not customer-facing. */
const HIDDEN_REQUIREMENT_KEYS = new Set([
  'consultationId',
  'readinessScore',
  'aiAnalysisRequested',
  'additionalRequirements',
])

export function toDeliverableView(item: OrderDeliverableResponse): DeliverableView {
  const requirement = item.requirement ?? {}
  return {
    id: item.id,
    name: item.deliverableTypeName || item.deliverableTypeId,
    format: orNull(item.defaultFormat),
    requirements: Object.entries(requirement)
      .filter(
        ([key, value]) =>
          !HIDDEN_REQUIREMENT_KEYS.has(key) &&
          (typeof value === 'string' || typeof value === 'number'),
      )
      .map(([key, value]) => ({ key, value: String(value) })),
    aiAnalysisRequested: requirement.aiAnalysisRequested === true,
  }
}

/**
 * The BE keeps no status history, so the timeline is derived only from the
 * fields it does return (created / review / last update).
 */
export function buildTimeline(order: OrderCreateResponse): OrderTimelineEvent[] {
  const status = normalizeStatus(order.orderStatus)
  const events: OrderTimelineEvent[] = []
  if (order.createdAt) {
    events.push({ kind: 'created', at: order.createdAt, actor: null, note: null })
  }
  if (order.reviewAt && (status !== 'PENDING')) {
    const rejected = status === 'REJECTED'
    events.push({
      kind: rejected ? 'rejected' : 'approved',
      at: order.reviewAt,
      actor: orNull(order.reviewByName),
      // The reason is shown once, in the review notice.
      note: null,
    })
  }
  const later: OrderStatus[] = ['IN_PROGRESS', 'COMPLETED', 'CANCELLED']
  if (later.includes(status) && order.updatedAt) {
    events.push({ kind: 'status', status, at: order.updatedAt, actor: null, note: null })
  }
  return events
}

export function toOrderDetail(order: OrderCreateResponse): OrderDetailView {
  const row = toOrderRow(order)
  return {
    ...row,
    description: orNull(order.description),
    checklistItems: order.checklistItems ?? [],
    checklistSnapshotAt: orNull(order.checklistSnapshotAt),
    latitude: orNull(order.latitude),
    longitude: orNull(order.longitude),
    rejectReason: orNull(order.rejectReason),
    reviewByName: orNull(order.reviewByName),
    reviewAt: orNull(order.reviewAt),
    updatedAt: orNull(order.updatedAt),
    deliverables: (order.deliverables ?? []).map(toDeliverableView),
    timeline: buildTimeline(order),
    canCancel: row.status === 'PENDING',
  }
}
