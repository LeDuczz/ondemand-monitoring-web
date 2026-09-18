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

export type CategoryService = {
  id: string
  name: string
  description?: string
}

export type PreferredTime = {
  id: string
  code?: string
  name: string
  startTime?: string
  endTime?: string
}

export type OrderCreatePayload = {
  title: string
  purpose?: string
  serviceId: string
  description?: string
  address?: string
  point: {
    type: 'Point'
    coordinates: [number, number]
  }
  preferredDate: string
  preferredTimeId: string
  mediaType: 'IMAGE' | 'VIDEO'
  durationOfVideo?: number
  numberOfPhoto?: number
}

export type OrderCreateResponse = OrderCreatePayload & {
  id: string
  customerId: string
  customerName?: string
  serviceName?: string
  preferredTimeName?: string
  orderStatus?: string
  createdAt?: string
  updatedAt?: string
}

export const orderApi = {
  getCategoryServices: () =>
    request<CategoryService[]>('/api/category-services'),
  getPreferredTimes: () => request<PreferredTime[]>('/api/preferred-times'),
  createOrder: (body: OrderCreatePayload) =>
    request<OrderCreateResponse>('/api/orders', { method: 'POST', body }),
}
