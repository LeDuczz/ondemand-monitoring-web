import { apiRequest } from '../../../shared/api/httpClient'
import type {
  CustomerDashboard,
  CustomerOrderDetail,
  CustomerOrderItem,
} from '../types/orders'

export type CreateOrderPayload = {
  title: string
  purpose?: string
  description?: string
  serviceId: string
  addressText: string
  centerLat: number
  centerLon: number
  radiusM: number
  preferredDate: string
  preferredTimeName: string
  mediaItems: Array<{
    mediaType: 'PHOTO' | 'VIDEO' | 'LIVESTREAM'
    quantity: number
    durationSec?: number
  }>
}

export const customerApi = {
  getDashboard: (signal?: AbortSignal) =>
    apiRequest<CustomerDashboard>('/api/customer/dashboard', { signal }),

  listOrders: (params: { status?: string; signal?: AbortSignal }) => {
    const qs = params.status ? `?status=${encodeURIComponent(params.status)}` : ''
    return apiRequest<{ items: CustomerOrderItem[] }>(
      `/api/customer/orders${qs}`,
      { signal: params.signal },
    )
  },

  getOrder: (orderId: string, signal?: AbortSignal) =>
    apiRequest<CustomerOrderDetail>(`/api/customer/orders/${orderId}`, {
      signal,
    }),

  createOrder: (payload: CreateOrderPayload) =>
    apiRequest<CustomerOrderDetail>('/api/customer/orders', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  cancelOrder: (orderId: string) =>
    apiRequest<CustomerOrderDetail>(`/api/customer/orders/${orderId}/cancel`, {
      method: 'POST',
    }),
}
