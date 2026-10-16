// Test-only vi.spyOn stubs for the create-order wizard endpoints that the real
// backend serves (services, preferred times, deliverables, pricing, checklist,
// consultations, POST /api/orders). Fixtures live in createOrderFixtures.ts.
import { vi } from 'vitest'

import { ApiError } from '../../../shared/api/httpClient'
import {
  customerApi,
  type ConsultationMessage,
  type CustomerConsultation,
} from '../api/customerApi'
import type { OrderCreateResponse } from '../api/orderApi'
import {
  SERVICE_PRICES,
  catalogServices,
  catalogTimes,
  mockRequirementSuggestions,
  mockServiceChecklist,
  mockServiceDeliverables,
} from './createOrderFixtures'

const AI_ANALYSIS_PRICE = 500_000
const DEFAULT_SERVICE_PRICE = 2_000_000
const REQUIRED = [
  'title',
  'serviceId',
  'latitude',
  'longitude',
  'coverageArea',
  'preferredDateFrom',
  'preferredDateTo',
  'preferredTimeId',
  'deliverables',
] as const

let seq = 0
const nextId = (prefix: string) => `${prefix}-${++seq}`

export function stubCreateOrderApi() {
  vi.spyOn(customerApi, 'listServices').mockImplementation(async () =>
    catalogServices.filter((s) => s.isActive),
  )
  vi.spyOn(customerApi, 'listPreferredTimes').mockImplementation(async () => catalogTimes)
  vi.spyOn(customerApi, 'listServiceDeliverables').mockImplementation(
    async (serviceId: string) =>
      mockServiceDeliverables.filter((d) => d.serviceId === serviceId),
  )
  vi.spyOn(customerApi, 'listRequirementSuggestions').mockImplementation(
    async (serviceId?: string) =>
      serviceId
        ? mockRequirementSuggestions.filter((s) => s.serviceId === serviceId)
        : mockRequirementSuggestions,
  )
  vi.spyOn(customerApi, 'getServiceChecklist').mockImplementation(async (serviceId: string) =>
    mockServiceChecklist(serviceId),
  )
  vi.spyOn(customerApi, 'getPricingEstimate').mockImplementation(
    async (serviceId: string, params = {}) => {
      const servicePrice = SERVICE_PRICES[serviceId] ?? DEFAULT_SERVICE_PRICE
      const withAi = Boolean(params.aiImageAnalysis)
      return {
        serviceId,
        servicePrice,
        additionalRequirements: withAi
          ? [
              {
                type: 'AI_IMAGE_ANALYSIS',
                description: 'AI image analysis',
                additionalPrice: AI_ANALYSIS_PRICE,
              },
            ]
          : [],
        totalPrice: servicePrice + (withAi ? AI_ANALYSIS_PRICE : 0),
      } as Awaited<ReturnType<typeof customerApi.getPricingEstimate>>
    },
  )

  const consultations: CustomerConsultation[] = []
  vi.spyOn(customerApi, 'startConsultation').mockImplementation(async () => {
    const session: CustomerConsultation = {
      id: nextId('cons'),
      status: 'ACTIVE',
      startedAt: new Date().toISOString(),
      messages: [
        { id: nextId('msg'), senderType: 'ASSISTANT', message: 'Xin chào! Bạn muốn giám sát điều gì?' },
      ],
    }
    consultations.push(session)
    return session
  })
  vi.spyOn(customerApi, 'getConsultation').mockImplementation(async (id: string) => {
    const found = consultations.find((c) => c.id === id)
    if (!found) throw new Error('Consultation not found')
    return found
  })
  vi.spyOn(customerApi, 'sendConsultationMessage').mockImplementation(
    async (id: string, message: string) => {
      const found = consultations.find((c) => c.id === id)
      if (!found) throw new Error('Consultation not found')
      const messages: ConsultationMessage[] = [
        ...(found.messages ?? []),
        { id: nextId('msg'), senderType: 'CUSTOMER', message },
        {
          id: nextId('msg'),
          senderType: 'ASSISTANT',
          message: 'Mình chưa đủ thông tin để đề xuất service chính xác.',
        },
      ]
      found.messages = messages
      return found
    },
  )

  vi.spyOn(customerApi, 'createOrder').mockImplementation(async (payload) => {
    const b = payload as unknown as Record<string, unknown>
    const errors: Record<string, string> = {}
    for (const key of REQUIRED) {
      const value = b[key]
      if (value === undefined || value === null || value === '') errors[key] = `${key} is required`
    }
    if (Array.isArray(b.deliverables) && b.deliverables.length === 0) {
      errors.deliverables = 'deliverables must not be empty'
    }
    if (Object.keys(errors).length) {
      throw new ApiError('Validation failed', {
        status: 400,
        code: 'VALIDATION_ERROR',
        errors,
        method: 'POST',
        path: '/api/orders',
      })
    }
    const now = new Date().toISOString()
    return {
      id: nextId('ord'),
      customerId: 'usr-customer',
      customerName: 'Khách hàng',
      title: String(b.title),
      serviceId: String(b.serviceId),
      orderStatus: 'PENDING',
      createdAt: now,
      updatedAt: now,
    } as OrderCreateResponse
  })
}
