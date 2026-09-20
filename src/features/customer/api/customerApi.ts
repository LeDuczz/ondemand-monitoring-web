import { apiRequest } from '../../../shared/api/httpClient'
import type {
  AiAnalysisResult,
  CustomerDashboard,
  CustomerOrderDetail,
  CustomerOrderItem,
  MediaDetail,
  MediaLibrary,
} from '../types/orders'

export type CreateOrderPayload = {
  title: string
  purpose?: string
  description?: string
  serviceIds: string[]
  addressText: string
  centerLat: number
  centerLon: number
  radiusM: number
  preferredDate: string
  preferredTimeName: string
  mediaRequests?: Array<{
    mediaType: 'PHOTO' | 'VIDEO' | 'LIVESTREAM'
    quantity?: number
    durationSec?: number
  }>
}

export const customerApi = {
  getDashboard: (signal?: AbortSignal) =>
    apiRequest<CustomerDashboard>('/api/customer/dashboard', { signal }),

  listOrders: (params: {
    status?: string
    serviceId?: string
    signal?: AbortSignal
  }) => {
    const qs = new URLSearchParams()
    if (params.status) qs.set('status', params.status)
    if (params.serviceId) qs.set('serviceId', params.serviceId)
    const q = qs.toString() ? `?${qs}` : ''
    return apiRequest<{ items: CustomerOrderItem[] }>(`/api/customer/orders${q}`, {
      signal: params.signal,
    })
  },

  getOrder: (orderId: string, signal?: AbortSignal) =>
    apiRequest<CustomerOrderDetail>(`/api/customer/orders/${orderId}`, { signal }),

  createOrder: (payload: CreateOrderPayload) =>
    apiRequest<CustomerOrderDetail>('/api/customer/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  saveDraft: (orderId: string, payload: Partial<CreateOrderPayload>) =>
    apiRequest<CustomerOrderDetail>(`/api/customer/orders/${orderId}/draft`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  cancelOrder: (orderId: string) =>
    apiRequest<CustomerOrderDetail>(`/api/customer/orders/${orderId}/cancel`, {
      method: 'POST',
    }),

  getAnalysis: (orderId: string, signal?: AbortSignal) =>
    apiRequest<AiAnalysisResult>(`/api/customer/orders/${orderId}/analysis`, { signal }),

  applyFindingSuggestion: (orderId: string, findingId: string) =>
    apiRequest<AiAnalysisResult>(
      `/api/customer/orders/${orderId}/analysis/findings/${findingId}/apply`,
      { method: 'POST' },
    ),

  ignoreFinding: (orderId: string, findingId: string) =>
    apiRequest<AiAnalysisResult>(
      `/api/customer/orders/${orderId}/analysis/findings/${findingId}/ignore`,
      { method: 'POST' },
    ),

  submitOrder: (orderId: string) =>
    apiRequest<CustomerOrderDetail>(`/api/customer/orders/${orderId}/submit`, {
      method: 'POST',
    }),

  getMediaLibrary: (params: { signal?: AbortSignal }) =>
    apiRequest<MediaLibrary>('/api/customer/media', { signal: params.signal }),

  getMediaDetail: (mediaId: string, signal?: AbortSignal) =>
    apiRequest<MediaDetail>(`/api/customer/media/${mediaId}`, { signal }),
}
