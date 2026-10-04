import { ApiError, apiRequest } from '../../../shared/api/httpClient'
import { readOrderChecklistSnapshot } from '../lib/orderChecklistSnapshot'
import type {
  ApprovalRequest,
  OrderAnalysis,
  OrderCreateResponse,
  OrderDetail,
  OrderInternalNote,
  OrderMissionBrief,
  OrderResourcePreview,
} from '../types/orders'

function formatRequirementValue(value: unknown, suffix = '') {
  if (typeof value !== 'number' && typeof value !== 'string') return null
  if (value === '') return null
  return `${value}${suffix}`
}

function formatRequirement(requirement: Record<string, unknown> | null) {
  if (!requirement) return ''
  const parts = [
    formatRequirementValue(requirement.mediaType),
    formatRequirementValue(requirement.quantity, ' mục'),
    formatRequirementValue(requirement.resolution),
    formatRequirementValue(requirement.radiusM, ' m'),
    formatRequirementValue(requirement.estimatedAreaHa, ' ha'),
  ].filter(Boolean)
  return parts.length > 0 ? ` · ${parts.join(' · ')}` : ''
}

function numberValue(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function radiusFromDeliverables(order: OrderCreateResponse) {
  for (const deliverable of order.deliverables ?? []) {
    const radius =
      numberValue(deliverable.requirement?.radiusM) ??
      numberValue(deliverable.requirement?.radius_m)
    if (radius != null) return radius
  }
  return null
}

function toOrderDetail(order: OrderCreateResponse): OrderDetail {
  return {
    id: order.id,
    code: order.id,
    status: order.orderStatus,
    customer: {
      fullName: order.customerName || order.customerId,
      companyName: '',
      email: null,
      phone: null,
    },
    serviceName: order.serviceName,
    preferredDate: order.preferredDateFrom,
    preferredDateFrom: order.preferredDateFrom,
    preferredDateTo: order.preferredDateTo,
    preferredTimeName: order.preferredTimeName,
    preferredWindow: order.preferredTimeName || null,
    submittedAt: order.createdAt,
    addressText: order.address || null,
    center:
      order.latitude != null && order.longitude != null
        ? { lat: order.latitude, lon: order.longitude }
        : null,
    radiusM: order.radiusM ?? radiusFromDeliverables(order),
    nearestBase: null,
    mediaRequirements:
      order.deliverables?.map((item) => ({
        label: `${item.deliverableTypeName}${formatRequirement(item.requirement)}`,
      })) ?? null,
    purpose: order.description || null,
    attachments: null,
  }
}

function toOrderMissionBrief(order: OrderDetail): OrderMissionBrief {
  return {
    id: order.id,
    code: order.code,
    serviceName: order.serviceName,
    customerFullName: order.customer.fullName,
    preferredDate: order.preferredDate,
    preferredDateFrom: order.preferredDateFrom ?? order.preferredDate,
    preferredDateTo: order.preferredDateTo ?? order.preferredDate,
    preferredTimeName: order.preferredTimeName,
    addressText: order.addressText,
    center: order.center,
    radiusM: order.radiusM,
    nearestBase: order.nearestBase,
    mediaRequirements: order.mediaRequirements,
  }
}

/** MNG-02 / MNG-03 order-review APIs. See evd/00-PLAN.md §3. */
export const ordersApi = {
  /** `GET /api/orders/pending` [BE]. */
  getQueue(signal?: AbortSignal): Promise<OrderCreateResponse[]> {
    return apiRequest<OrderCreateResponse[]>('/api/orders/pending', {
      signal,
    })
  },

  /** `GET /api/orders/approved` [BE]. */
  getApproved(signal?: AbortSignal): Promise<OrderCreateResponse[]> {
    return apiRequest<OrderCreateResponse[]>('/api/orders/approved', {
      signal,
    })
  },

  /** `GET /api/orders/{id}` [TK]. */
  getOrder(id: string, signal?: AbortSignal): Promise<OrderDetail> {
    return apiRequest<OrderCreateResponse | OrderDetail>(`/api/orders/${id}`, {
      signal,
    }).then((order) => ({
      ...('customer' in order ? order : toOrderDetail(order)),
      ...readOrderChecklistSnapshot(order, id),
    }))
  },

  /** `GET /api/orders/{id}/analysis/latest` [BRIEF C4]. */
  getLatestAnalysis(id: string, signal?: AbortSignal): Promise<OrderAnalysis> {
    return apiRequest<OrderAnalysis>(`/api/orders/${id}/analysis/latest`, {
      signal,
    })
  },

  /**
   * `GET /api/orders/{id}/resource-preview` — PROPOSED, no source endpoint.
   * `null` for orders without design-sourced preview content.
   */
  getResourcePreview(
    id: string,
    signal?: AbortSignal,
  ): Promise<OrderResourcePreview | null> {
    return apiRequest<OrderResourcePreview | null>(
      `/api/orders/${id}/resource-preview`,
      { signal },
    )
  },

  /** `PUT /api/orders/{id}/internal-note` — PROPOSED, no source endpoint. */
  saveInternalNote(id: string, note: string): Promise<OrderInternalNote> {
    return apiRequest<OrderInternalNote>(`/api/orders/${id}/internal-note`, {
      method: 'PUT',
      body: { note },
    })
  },

  /** `POST /api/orders/{id}/approve` [BE] — approves only; staff schedules the mission later. */
  approve(id: string): Promise<OrderCreateResponse | void> {
    return apiRequest<OrderCreateResponse | void>(`/api/orders/${id}/approve`, {
      method: 'POST',
    })
  },

  /** `POST /api/orders/{id}/approval` [BRIEF C4] `{decision, reason}`. */
  submitApproval(id: string, request: ApprovalRequest): Promise<void> {
    return apiRequest<void>(`/api/orders/${id}/approval`, {
      method: 'POST',
      body: request,
    })
  },

  /** Read-only order projection used to prefill CreateMissionPage (MNG-04). */
  getOrderForMission(
    id: string,
    signal?: AbortSignal,
  ): Promise<OrderMissionBrief> {
    return this.getOrder(id, signal)
      .then((order) => {
        if (order.status !== 'APPROVED') {
          throw new ApiError('Đơn không còn ở trạng thái đã duyệt.', {
            status: 409,
            method: 'GET',
            path: `/api/orders/${id}`,
          })
        }
        return toOrderMissionBrief(order)
      })
      .catch((error) => {
        if (error instanceof ApiError && error.status === 409) {
          return apiRequest<OrderMissionBrief>(
            `/api/orders/${id}/mission-brief`,
            {
              signal,
            },
          )
        }
        throw error
      })
  },
}
