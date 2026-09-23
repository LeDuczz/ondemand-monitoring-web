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
  description?: string
  serviceId: string
  address?: string
  longitude: number
  latitude: number
  coverageArea: GeoJsonPolygon
  preferredDateFrom: string
  preferredDateTo: string
  preferredTimeId: string
  deliverables: Array<{
    deliverableTypeId: string
    requirement: Record<string, unknown>
  }>
}

export type GeoJsonPolygon = {
  type: 'Polygon'
  coordinates: number[][][]
}

export type ServiceOption = {
  id: string
  name: string
  description?: string
  isActive?: boolean
}

export type PreferredTimeOption = {
  id: string
  code?: string
  name: string
  startTime?: string
  endTime?: string
}

export type ServiceDeliverableOption = {
  id: string
  serviceId: string
  serviceName?: string
  deliverableTypeId: string
  deliverableTypeName?: string
}

export type ConsultationMessage = {
  id: string
  senderType: 'CUSTOMER' | 'ASSISTANT'
  message: string
  createdAt?: string
}

export type CustomerConsultation = {
  id: string
  customerId?: string
  orderId?: string
  recommendedServiceId?: string
  recommendedServiceName?: string
  status?: string
  requirementData?: string
  requirementSummary?: string
  startedAt?: string
  completedAt?: string
  messages?: ConsultationMessage[]
}

type SendConsultationMessageOptions = {
  signal?: AbortSignal
  requestContext?: string
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

  listServices: (signal?: AbortSignal) =>
    apiRequest<ServiceOption[]>('/api/services', {
      query: { activeOnly: true },
      signal,
    }),

  listPreferredTimes: (signal?: AbortSignal) =>
    apiRequest<PreferredTimeOption[]>('/api/preferred-times', { signal }),

  listServiceDeliverables: (serviceId: string, signal?: AbortSignal) =>
    apiRequest<ServiceDeliverableOption[]>('/api/service-deliverables', {
      query: { serviceId },
      signal,
    }),

  startConsultation: (signal?: AbortSignal) =>
    apiRequest<CustomerConsultation>('/api/customer/consultations', {
      method: 'POST',
      signal,
    }),

  getConsultation: (consultationId: string, signal?: AbortSignal) =>
    apiRequest<CustomerConsultation>(
      `/api/customer/consultations/${encodeURIComponent(consultationId)}`,
      { signal },
    ),

  sendConsultationMessage: (
    consultationId: string,
    message: string,
    options: SendConsultationMessageOptions = {},
  ) =>
    apiRequest<CustomerConsultation>(
      `/api/customer/consultations/${encodeURIComponent(consultationId)}/messages`,
      {
        method: 'POST',
        body: {
          message,
          requestContext: options.requestContext,
        },
        signal: options.signal,
      },
    ),

  createOrder: (payload: CreateOrderPayload) =>
    apiRequest<CustomerOrderDetail>('/api/orders', {
      method: 'POST',
      body: payload,
    }),

  saveDraft: (orderId: string, payload: Partial<CreateOrderPayload>) =>
    apiRequest<CustomerOrderDetail>(`/api/customer/orders/${orderId}/draft`, {
      method: 'PATCH',
      body: payload,
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
