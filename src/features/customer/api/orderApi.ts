import { env } from '../../../config/env'
import { authenticatedFetch } from '../../auth/api/authApi'

type ApiResponse<T> = {
  success?: boolean
  message?: string
  code?: string
  errors?: Record<string, string>
  data?: T
}

type RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown }

export class OrderApiError extends Error {
  readonly code?: string
  readonly errors?: Record<string, string>

  constructor(message: string, code?: string, errors?: Record<string, string>) {
    super(message)
    this.name = 'OrderApiError'
    this.code = code
    this.errors = errors
  }
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')
  if (options.body !== undefined)
    headers.set('Content-Type', 'application/json')

  let response: Response
  try {
    response = await authenticatedFetch(`${env.apiBaseUrl}${path}`, {
      ...options,
      body:
        options.body === undefined ? undefined : JSON.stringify(options.body),
      headers,
    })
  } catch {
    throw new OrderApiError('Unable to reach the order service.')
  }

  const payload = (await response.json().catch(() => undefined)) as
    ApiResponse<T> | undefined

  if (!response.ok || payload?.success === false) {
    throw new OrderApiError(
      payload?.message ?? 'Request failed. Please try again.',
      payload?.code,
      payload?.errors,
    )
  }

  return payload?.data as T
}

/** Deliverable line of the backend `OrderDeliverableResponse`. */
export type OrderDeliverableResponse = {
  id: string
  deliverableTypeId: string
  deliverableTypeName?: string
  defaultFormat?: string
  requirement?: Record<string, unknown>
}

/** Backend `OrderCreateResponse` (POST /api/orders, GET /api/orders/pending). */
export type OrderCreateResponse = {
  id: string
  customerId: string
  customerName?: string
  title?: string
  serviceId?: string
  serviceName?: string
  description?: string
  address?: string
  longitude?: number
  latitude?: number
  radiusM?: number
  coverageArea?: Record<string, unknown>
  preferredDateFrom?: string
  preferredDateTo?: string
  preferredTimeId?: string
  preferredTimeName?: string
  orderStatus?: string
  rejectReason?: string
  reviewById?: string
  reviewByName?: string
  reviewAt?: string
  deliverables?: OrderDeliverableResponse[]
  createdAt?: string
  updatedAt?: string
}

export const orderApi = {
  getPendingOrders: () =>
    request<OrderCreateResponse[]>('/api/orders/pending', { method: 'GET' }),
  approveOrder: (orderId: string) =>
    request<void>(`/api/orders/${encodeURIComponent(orderId)}/approve`, {
      method: 'POST',
    }),
}
