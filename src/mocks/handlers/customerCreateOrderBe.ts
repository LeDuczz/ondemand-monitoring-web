// Mock handlers in the BE DTO shape (ApiResponse envelope) for the customer
// "create order" wizard, so it runs offline. Verified against /v3/api-docs:
//   GET  /api/services/pricing-estimate        ?serviceId&aiImageAnalysis
//   GET  /api/services/requirement-suggestions ?serviceId
//   GET  /api/service-deliverables             ?serviceId&deliverableTypeId
//   GET  /api/category-services
//   GET  /api/zones                            ZoneResponse[] (simulation map zones)
//   POST /api/orders                           OrderCreateRequest -> OrderCreateResponse
//   POST /api/customer/consultations
//   GET  /api/customer/consultations/:id
//   POST /api/customer/consultations/:id/messages
// Must be imported BEFORE catalogBe so `/api/services/pricing-estimate` is not
// swallowed by `GET /api/services/:id`.
import type {
  ConsultationMessage,
  CustomerConsultation,
} from '../../features/customer/api/customerApi'
import type { OrderCreateResponse } from '../../features/customer/api/orderApi'
import { createCollection } from '../db'
import {
  created,
  fail,
  isRealApiRoute,
  ok,
  passThrough,
  registerMockRoutes,
} from '../mockServer'
import {
  mockCategoryServices,
  mockRequirementSuggestions,
  mockServiceDeliverables,
} from '../data/customerCreateOrderSeeds'
import { createdOrders } from './customerOrdersStore'
import type {
  ChecklistInput,
  ServiceChecklistItem,
} from '../../features/customer/lib/checklist/types'

export const mockServiceChecklist = (
  serviceId: string,
): ServiceChecklistItem[] =>
  ({
    'svc-construction': [
      'Kiểm tra tình trạng tổng thể công trình',
      'Ghi nhận tiến độ các khu vực đang thi công',
      'Kiểm tra mặt ngoài công trình',
      'Quan sát khu vực khó tiếp cận',
      'Chụp ảnh tổng quan công trình',
      'Ghi nhận hiện trạng sau khi hoàn tất kiểm tra',
    ],
    'svc-factory': [
      'Kiểm tra tình trạng tổng thể nhà xưởng',
      'Kiểm tra mái nhà xưởng',
      'Kiểm tra bề mặt và kết cấu phía trên',
      'Quan sát khu vực khó tiếp cận',
      'Chụp ảnh các vị trí bất thường',
      'Ghi nhận hiện trạng sau khi hoàn tất kiểm tra',
    ],
    'svc-area': [
      'Ghi nhận toàn cảnh khu vực',
      'Ghi nhận các khu vực chính',
      'Quan sát khu vực khó tiếp cận',
      'Chụp ảnh các vị trí khách hàng yêu cầu',
      'Ghi nhận hiện trạng khu vực',
    ],
    'svc-forest': [
      'Ghi nhận toàn cảnh khu vực rừng',
      'Quan sát tình trạng khu vực cây xanh',
      'Quan sát khu vực có dấu hiệu bất thường',
      'Quan sát khu vực khó tiếp cận',
      'Chụp ảnh các vị trí được chỉ định',
      'Ghi nhận hiện trạng sau khi hoàn tất giám sát',
    ],
  }[serviceId] ?? []).map((content, index) => ({
    id: `assignment-${serviceId}-${index + 1}`,
    serviceId,
    checklistId: `check-${serviceId}-${index + 1}`,
    content,
    displayOrder: index,
    checklistVersion: 1,
    serviceActive: true,
    checklistActive: true,
  }))

const SERVICE_PRICES: Record<string, number> = {
  'svc-construction': 3_500_000,
  'svc-factory': 3_000_000,
  'svc-area': 2_500_000,
  'svc-forest': 4_000_000,
}
const DEFAULT_SERVICE_PRICE = 2_000_000
const AI_ANALYSIS_PRICE = 500_000

// Simulation-map zones: one big monitoring zone containing the wizard's default
// point and one restricted (no-fly) zone away from it.
const square = (min: number, max: number) => [
  [min, min],
  [max, min],
  [max, max],
  [min, max],
  [min, min],
]
const zones = [
  {
    id: 'zone-mon',
    code: 'MON-1',
    name: 'Khu giám sát A',
    zoneType: 'MONITORING',
    restricted: false,
    coordinates: square(0, 1000),
  },
  {
    id: 'zone-nofly',
    code: 'NOFLY-1',
    name: 'Vùng cấm sân bay',
    zoneType: 'RESTRICTED',
    restricted: true,
    coordinates: square(500, 600),
  },
]

const consultations = createCollection<CustomerConsultation[]>([])

/** The wizard stores the picked radius in the first deliverable requirement. */
function radiusOf(deliverables: unknown): number | undefined {
  const first = Array.isArray(deliverables) ? deliverables[0] : undefined
  const radius = Number(first?.requirement?.radiusM)
  return Number.isFinite(radius) && radius > 0 ? radius : undefined
}

let seq = 0
const nextId = (prefix: string) => `${prefix}-${++seq}`
const notFound = (what: string) => fail(404, 'NOT_FOUND', `${what} not found`)

type ConsultationService = {
  id: string
  name: string
  description: string
}

const STOP_WORDS = new Set([
  'ai',
  'anh',
  'bang',
  'ban',
  'bao',
  'can',
  'cho',
  'co',
  'cua',
  'de',
  'dich',
  'duoc',
  'giup',
  'giam',
  'hang',
  'hay',
  'ho',
  'khach',
  'khu',
  'la',
  'minh',
  'mot',
  'muon',
  'nhu',
  'phu',
  'sat',
  'service',
  'the',
  'toi',
  'tu',
  'van',
  'va',
  've',
  'voi',
  'yeu',
])

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
}

function tokenize(value: string) {
  return normalizeText(value)
    .replace(/[^a-z0-9\s/]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token))
}

function parseServicesFromContext(requestContext?: string) {
  if (!requestContext) return []
  return requestContext
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- svc-') && line.includes('|'))
    .map((line) => {
      const [id, name, description] = line
        .replace(/^- /, '')
        .split('|')
        .map((part) => part.trim())
      return id && name ? { id, name, description: description ?? '' } : null
    })
    .filter((item): item is ConsultationService => Boolean(item))
}

function consultationServices(requestContext?: string) {
  const fromContext = parseServicesFromContext(requestContext)
  return fromContext
}

function extractCustomerEvidence(requestContext?: string) {
  if (!requestContext) return ''
  const lines: string[] = []
  let insideServiceCatalog = false
  for (const rawLine of requestContext.split('\n')) {
    const line = rawLine.trim()
    if (line.includes('Danh sách service active từ BE:')) {
      insideServiceCatalog = true
      continue
    }
    if (insideServiceCatalog) continue
    lines.push(line)
  }
  return lines.join('\n')
}

function recommendService(
  message: string,
  requestContext?: string,
  history: ConsultationMessage[] = [],
) {
  const evidence = [
    extractCustomerEvidence(requestContext),
    ...history
      .filter((item) => item.senderType === 'CUSTOMER')
      .map((item) => item.message),
    message,
  ].join('\n')
  const messageText = normalizeText(evidence)
  const messageTokens = new Set(tokenize(evidence))
  const ranked = consultationServices(requestContext)
    .map((service) => {
      const serviceText = normalizeText(
        `${service.name} ${service.description}`,
      )
      const serviceTokens = new Set(tokenize(serviceText))
      let score = 0
      for (const token of messageTokens) {
        if (serviceTokens.has(token)) score += token.length
      }
      if (
        serviceText.includes(messageText) ||
        messageText.includes(serviceText)
      ) {
        score += 20
      }
      return { service, score }
    })
    .sort((a, b) => b.score - a.score)

  const [best, second] = ranked
  if (!best || best.score < 3) return null
  if (second && second.score === best.score) return null
  return best.service
}

function buildClarifyingReply(requestContext?: string) {
  const serviceExamples = consultationServices(requestContext)
    .slice(0, 5)
    .map((service) => service.name)
    .join(', ')
  const focusQuestion = serviceExamples
    ? `Bạn mô tả thêm giúp mình đối tượng cần giám sát thuộc nhóm nào: ${serviceExamples}, hoặc service khác trong danh mục?`
    : 'Bạn mô tả thêm giúp mình đối tượng cần giám sát là gì?'

  return [
    'Mình chưa đủ thông tin để đề xuất service chính xác.',
    focusQuestion,
    'Bạn có thể nói rõ mục tiêu ưu tiên, phạm vi khu vực và loại kết quả cần nhận như ảnh, video, báo cáo tiến độ hoặc phân tích nhiệt.',
  ].join('\n\n')
}

function buildRecommendationReply(service: ConsultationService) {
  return [
    `Mình hiểu nhu cầu của bạn phù hợp nhất với service ${service.name}.`,
    `Mình gợi ý dịch vụ ${service.name}.`,
    'Nếu đúng, bạn có thể tiếp tục chọn kết quả cần nhận; nếu chưa đúng, hãy nói thêm mục tiêu hoặc rủi ro muốn kiểm tra để mình chỉnh gợi ý.',
  ].join('\n\n')
}

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

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/services/:serviceId/checklists',
    handler: ({ params }) => ok(mockServiceChecklist(params.serviceId)),
  },
  {
    method: 'GET',
    path: '/api/services/pricing-estimate',
    handler: ({ query }) => {
      const serviceId = query.get('serviceId')
      if (!serviceId) {
        return fail(400, 'VALIDATION_ERROR', 'Validation failed', {
          serviceId: 'serviceId is required',
        })
      }
      const servicePrice = SERVICE_PRICES[serviceId] ?? DEFAULT_SERVICE_PRICE
      const withAi = query.get('aiImageAnalysis') === 'true'
      const additionalRequirements = withAi
        ? [
            {
              type: 'AI_IMAGE_ANALYSIS',
              description: 'AI image analysis',
              additionalPrice: AI_ANALYSIS_PRICE,
            },
          ]
        : []
      return ok({
        serviceId,
        servicePrice,
        additionalRequirements,
        totalPrice: servicePrice + (withAi ? AI_ANALYSIS_PRICE : 0),
      })
    },
  },
  {
    method: 'GET',
    path: '/api/services/requirement-suggestions',
    handler: ({ query }) => {
      const serviceId = query.get('serviceId')
      return ok(
        serviceId
          ? mockRequirementSuggestions.filter((s) => s.serviceId === serviceId)
          : mockRequirementSuggestions,
      )
    },
  },
  {
    method: 'GET',
    path: '/api/service-deliverables',
    handler: ({ query }) => {
      const serviceId = query.get('serviceId')
      const typeId = query.get('deliverableTypeId')
      return ok(
        mockServiceDeliverables.filter(
          (d) =>
            (!serviceId || d.serviceId === serviceId) &&
            (!typeId || d.deliverableTypeId === typeId),
        ),
      )
    },
  },
  { method: 'GET', path: '/api/zones', handler: () => ok([...zones]) },
  {
    method: 'GET',
    path: '/api/category-services',
    handler: () => ok([...mockCategoryServices]),
  },
  {
    method: 'POST',
    path: '/api/orders',
    handler: ({ body }) => {
      if (isRealApiRoute('POST', '/api/orders')) return passThrough()
      const b = (body ?? {}) as Record<string, unknown>
      const errors: Record<string, string> = {}
      for (const key of REQUIRED) {
        const value = b[key]
        if (value === undefined || value === null || value === '')
          errors[key] = `${key} is required`
      }
      if (Array.isArray(b.deliverables) && b.deliverables.length === 0) {
        errors.deliverables = 'deliverables must not be empty'
      }
      if (Object.keys(errors).length) {
        return fail(400, 'VALIDATION_ERROR', 'Validation failed', errors)
      }
      const now = new Date().toISOString()
      const template = mockServiceChecklist(String(b.serviceId))
      const checklist = (b.checklistItems ??
        template.map((item) => ({
          sourceChecklistId: item.checklistId,
          expectedChecklistVersion: item.checklistVersion,
        }))) as ChecklistInput[]
      const order: OrderCreateResponse = {
        id: nextId('ord'),
        customerId: 'usr-customer',
        customerName: 'Khách hàng',
        title: String(b.title),
        serviceId: String(b.serviceId),
        description: b.description as string | undefined,
        address: b.address as string | undefined,
        longitude: Number(b.longitude),
        latitude: Number(b.latitude),
        radiusM: radiusOf(b.deliverables),
        coverageArea: b.coverageArea as Record<string, unknown>,
        preferredDateFrom: String(b.preferredDateFrom),
        preferredDateTo: String(b.preferredDateTo),
        preferredTimeId: String(b.preferredTimeId),
        orderStatus: 'PENDING',
        checklistSnapshotAt: now,
        checklistItems: checklist.map((item, displayOrder) => ({
          id: nextId('snapshot'),
          sourceChecklistId: item.sourceChecklistId ?? null,
          content:
            item.contentOverride ??
            template.find((row) => row.checklistId === item.sourceChecklistId)
              ?.content ??
            '',
          displayOrder,
          sourceType: item.sourceChecklistId
            ? 'SERVICE_TEMPLATE'
            : 'CUSTOMER_CUSTOM',
        })),
        deliverables: (b.deliverables as Array<Record<string, unknown>>).map(
          (d, i) => ({
            id: `od-${i + 1}`,
            deliverableTypeId: String(d.deliverableTypeId),
            requirement: (d.requirement as Record<string, unknown>) ?? {},
          }),
        ),
        createdAt: now,
        updatedAt: now,
      }
      createdOrders.push(order)
      return created(order)
    },
  },
  {
    method: 'POST',
    path: '/api/customer/consultations',
    handler: () => {
      const session: CustomerConsultation = {
        id: nextId('cons'),
        status: 'ACTIVE',
        startedAt: new Date().toISOString(),
        messages: [
          {
            id: nextId('msg'),
            senderType: 'ASSISTANT',
            message: 'Xin chào! Bạn muốn giám sát điều gì?',
          },
        ],
      }
      consultations.push(session)
      return created(session)
    },
  },
  {
    method: 'GET',
    path: '/api/customer/consultations/:id',
    handler: ({ params }) => {
      const found = consultations.find((c) => c.id === params.id)
      return found ? ok(found) : notFound('Consultation')
    },
  },
  {
    method: 'POST',
    path: '/api/customer/consultations/:id/messages',
    handler: ({ params, body }) => {
      const found = consultations.find((c) => c.id === params.id)
      if (!found) return notFound('Consultation')
      const request = body as
        { message?: string; requestContext?: string } | undefined
      const text = String(request?.message ?? '').trim()
      if (!text) {
        return fail(400, 'VALIDATION_ERROR', 'Validation failed', {
          message: 'message is required',
        })
      }
      const recommendation = recommendService(
        text,
        request?.requestContext,
        found.messages,
      )
      const assistantMessage = recommendation
        ? buildRecommendationReply(recommendation)
        : buildClarifyingReply(request?.requestContext)
      found.messages = [
        ...(found.messages ?? []),
        { id: nextId('msg'), senderType: 'CUSTOMER', message: text },
        {
          id: nextId('msg'),
          senderType: 'ASSISTANT',
          message: assistantMessage,
        },
      ]
      found.status = recommendation ? 'READY_FOR_CONFIRMATION' : 'ACTIVE'
      found.recommendedServiceId = recommendation?.id
      found.recommendedServiceName = recommendation?.name
      found.requirementSummary = text
      found.requestTitle = recommendation?.name
      found.requestSummary = text
      return ok(found)
    },
  },
])
