import { apiRequest } from '../../../shared/api/httpClient'
import type { OrderStatus } from '../../../shared/types/domain'
import type {
  AiAnalysisResult,
  CustomerDashboard,
  CustomerOrderDetail,
  CustomerOrderItem,
  MediaDetail,
  MediaLibrary,
} from '../types/orders'
import { normalizeStatus } from '../lib/orders/mapOrder'
import type { OrderCreateResponse } from './orderApi'

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

export type ServicePricingEstimate = {
  serviceId: string
  servicePrice: number
  additionalRequirements: Array<{
    type: 'AI_IMAGE_ANALYSIS' | string
    description: string
    additionalPrice: number
  }>
  totalPrice: number
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
  createdAt?: string
  updatedAt?: string
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

export type ServiceRequirementSuggestion = {
  id: string
  serviceId?: string
  category: string
  label: string
  message: string
  sortOrder?: number
  source?: string
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
  requestTitle?: string
  requestSummary?: string
  startedAt?: string
  completedAt?: string
  messages?: ConsultationMessage[]
}

type SendConsultationMessageOptions = {
  signal?: AbortSignal
  requestContext?: string
}

const BACKEND_ORDER_STATUSES = new Set<OrderStatus>([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])

function getPreferredDate(order: OrderCreateResponse) {
  return (
    order.preferredDateFrom ??
    order.preferredDateTo ??
    order.createdAt ??
    new Date().toISOString()
  )
}

function toCustomerOrderItem(order: OrderCreateResponse): CustomerOrderItem {
  const status = normalizeStatus(order.orderStatus)
  return {
    id: order.id,
    orderCode: order.id,
    title: order.title ?? 'Đơn giám sát',
    addressText: order.address ?? null,
    preferredDate: getPreferredDate(order),
    preferredTimeLabel: order.preferredTimeName ?? null,
    radiusM: order.radiusM ?? null,
    status,
    serviceNames: order.serviceName ? [order.serviceName] : [],
    missionCount:
      status === 'APPROVED' ||
      status === 'IN_PROGRESS' ||
      status === 'COMPLETED'
        ? 1
        : 0,
    hasNewMedia: false,
    submittedAt: order.createdAt ?? null,
    canCancel: status === 'PENDING',
  }
}

export const customerApi = {
  getDashboard: (signal?: AbortSignal) =>
    apiRequest<CustomerDashboard>('/api/customer/dashboard', { signal }),

  /** `GET /api/orders/mine[?status]` [BE]: the whole list, no paging. */
  listMyOrders: (params: { status?: OrderStatus; signal?: AbortSignal } = {}) =>
    apiRequest<OrderCreateResponse[]>('/api/orders/mine', {
      query: { status: params.status },
      signal: params.signal,
    }),

  /** `GET /api/orders/{id}` [BE] `OrderCreateResponse`. */
  getOrderById: (orderId: string, signal?: AbortSignal) =>
    apiRequest<OrderCreateResponse>(
      `/api/orders/${encodeURIComponent(orderId)}`,
      { signal },
    ),

  /** Legacy list shape, still used by the support ticket dialog. */
  listOrders: (params: {
    status?: string
    serviceId?: string
    signal?: AbortSignal
  }) => {
    const status = params.status as OrderStatus | undefined
    if (status && !BACKEND_ORDER_STATUSES.has(status)) {
      return Promise.resolve({ items: [] as CustomerOrderItem[] })
    }
    return customerApi
      .listMyOrders({ status, signal: params.signal })
      .then((orders) => ({ items: orders.map(toCustomerOrderItem) }))
  },

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

  listRequirementSuggestions: (serviceId?: string, signal?: AbortSignal) =>
    apiRequest<ServiceRequirementSuggestion[]>(
      '/api/services/requirement-suggestions',
      {
        query: serviceId ? { serviceId } : undefined,
        signal,
      },
    ),

  getPricingEstimate: (
    serviceId: string,
    params: { aiImageAnalysis?: boolean; signal?: AbortSignal } = {},
  ) =>
    apiRequest<ServicePricingEstimate>('/api/services/pricing-estimate', {
      query: {
        serviceId,
        aiImageAnalysis: Boolean(params.aiImageAnalysis),
      },
      signal: params.signal,
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

  /** `POST /api/orders` [BE] `OrderCreateRequest` -> `OrderCreateResponse`. */
  createOrder: (payload: CreateOrderPayload) =>
    apiRequest<OrderCreateResponse>('/api/orders', {
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
    apiRequest<AiAnalysisResult>(`/api/customer/orders/${orderId}/analysis`, {
      signal,
    }),

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
