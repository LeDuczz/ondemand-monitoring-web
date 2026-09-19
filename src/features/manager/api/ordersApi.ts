import { apiRequest } from '../../../shared/api/httpClient'
import type {
  OrderAnalysis,
  OrderDetail,
  OrderInternalNote,
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

  /** `GET /api/orders/{id}/resource-preview` — PROPOSED, no source endpoint. */
  getResourcePreview(
    id: string,
    signal?: AbortSignal,
  ): Promise<OrderResourcePreview> {
    return apiRequest<OrderResourcePreview>(
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
}
