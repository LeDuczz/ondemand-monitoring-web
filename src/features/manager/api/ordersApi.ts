import { apiRequest } from '../../../shared/api/httpClient'
import type {
  ApprovalRequest,
  OrderAnalysis,
  OrderDetail,
  OrderInternalNote,
  OrderMissionBrief,
  OrderQueueItem,
  OrderResourcePreview,
} from '../types/orders'

/** MNG-02 / MNG-03 order-review APIs. See evd/00-PLAN.md §3. */
export const ordersApi = {
  /** `GET /api/orders?status=PENDING` [TK path; BE OrderStatus value]. */
  getQueue(signal?: AbortSignal): Promise<OrderQueueItem[]> {
    return apiRequest<OrderQueueItem[]>('/api/orders', {
      query: { status: 'PENDING' },
      signal,
    })
  },

  /** `GET /api/orders/{id}` [TK]. */
  getOrder(id: string, signal?: AbortSignal): Promise<OrderDetail> {
    return apiRequest<OrderDetail>(`/api/orders/${id}`, { signal })
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

  /** `POST /api/orders/{id}/approve` [BE] — no body, creates a mission. */
  approve(id: string): Promise<void> {
    return apiRequest<void>(`/api/orders/${id}/approve`, { method: 'POST' })
  },

  /** `POST /api/orders/{id}/approval` [BRIEF C4] `{decision, reason}`. */
  submitApproval(id: string, request: ApprovalRequest): Promise<void> {
    return apiRequest<void>(`/api/orders/${id}/approval`, {
      method: 'POST',
      body: request,
    })
  },

  /**
   * `GET /api/orders/{id}/mission-brief` — PROPOSED (P5). Read-only order
   * projection for an APPROVED order, used to prefill CreateMissionPage
   * (MNG-04). See `OrderMissionBrief` for why this can't reuse `getOrder`.
   */
  getOrderForMission(
    id: string,
    signal?: AbortSignal,
  ): Promise<OrderMissionBrief> {
    return apiRequest<OrderMissionBrief>(`/api/orders/${id}/mission-brief`, {
      signal,
    })
  },
}
