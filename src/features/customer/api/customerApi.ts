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
  startedAt?: string
  completedAt?: string
  messages?: ConsultationMessage[]
}

type SendConsultationMessageOptions = {
  signal?: AbortSignal
  requestContext?: string
}

type BackendOrderResponse = {
  id: string
  title?: string | null
  serviceName?: string | null
  description?: string | null
  address?: string | null
  longitude?: number | null
  latitude?: number | null
  radiusM?: number | null
  preferredDateFrom?: string | null
  preferredDateTo?: string | null
  preferredTimeName?: string | null
  orderStatus?: OrderStatus | null
  rejectReason?: string | null
  reviewByName?: string | null
  reviewAt?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

const BACKEND_ORDER_STATUSES = new Set<OrderStatus>([
  'PENDING',
  'APPROVED',
  'REJECTED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
])

function getPreferredDate(order: BackendOrderResponse) {
  return (
    order.preferredDateFrom ??
    order.preferredDateTo ??
    order.createdAt ??
    new Date().toISOString()
  )
}

function toCustomerOrderItem(order: BackendOrderResponse): CustomerOrderItem {
  const status = order.orderStatus ?? 'PENDING'
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
    missionCount: status === 'APPROVED' || status === 'IN_PROGRESS' || status === 'COMPLETED' ? 1 : 0,
    hasNewMedia: false,
    submittedAt: order.createdAt ?? null,
    canCancel: status === 'PENDING',
  }
}

function toCustomerOrderDetail(order: BackendOrderResponse): CustomerOrderDetail {
  const status = order.orderStatus ?? 'PENDING'
  const statusAt = order.updatedAt ?? order.createdAt ?? new Date().toISOString()
  return {
    id: order.id,
    orderCode: order.id,
    title: order.title ?? 'Đơn giám sát',
    purpose: null,
    description: order.description ?? null,
    addressText: order.address ?? null,
    centerLat: order.latitude ?? null,
    centerLon: order.longitude ?? null,
    radiusM: order.radiusM ?? null,
    preferredDate: getPreferredDate(order),
    preferredTimeName: order.preferredTimeName ?? null,
    status,
    serviceNames: order.serviceName ? [order.serviceName] : [],
    submittedAt: order.createdAt ?? null,
    approvalDecision:
      status === 'APPROVED' ? 'APPROVED' : status === 'REJECTED' ? 'REJECTED' : null,
    approvalReason: order.rejectReason ?? null,
    approvalAt: order.reviewAt ?? null,
    approvalActorName: order.reviewByName ?? null,
    statusHistory: [
      {
        status,
        at: statusAt,
        actorName: order.reviewByName ?? null,
        note: order.rejectReason ?? null,
      },
    ],
    missions: [],
    aiSummary: null,
    canCancel: status === 'PENDING',
  }
}

export const customerApi = {
  getDashboard: (signal?: AbortSignal) =>
    apiRequest<CustomerDashboard>('/api/customer/dashboard', { signal }),

  listOrders: (params: {
    status?: string
    serviceId?: string
    signal?: AbortSignal
  }) => {
    const status = params.status as OrderStatus | undefined
    if (status && !BACKEND_ORDER_STATUSES.has(status)) {
      return Promise.resolve({ items: [] })
    }

    return apiRequest<BackendOrderResponse[]>('/api/orders/mine', {
      query: { status },
      signal: params.signal,
    }).then((orders) => ({
      items: orders.map(toCustomerOrderItem),
    }))
  },

  getOrder: (orderId: string, signal?: AbortSignal) =>
    apiRequest<BackendOrderResponse>(`/api/orders/${orderId}`, { signal }).then(
      toCustomerOrderDetail,
    ),

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
    apiRequest<ServiceRequirementSuggestion[]>('/api/services/requirement-suggestions', {
      query: serviceId ? { serviceId } : undefined,
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
