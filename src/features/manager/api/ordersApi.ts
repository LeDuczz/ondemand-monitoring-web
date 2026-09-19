import { apiRequest } from '../../../shared/api/httpClient'
import type { OrderQueueItem } from '../types/orders'

/** MNG-02 / MNG-03 order-review APIs. See evd/00-PLAN.md §3. */
export const ordersApi = {
  /** `GET /api/orders?status=PENDING` [TK path; BE OrderStatus value]. */
  getQueue(signal?: AbortSignal): Promise<OrderQueueItem[]> {
    return apiRequest<OrderQueueItem[]>('/api/orders', {
      query: { status: 'PENDING' },
      signal,
    })
  },
}
