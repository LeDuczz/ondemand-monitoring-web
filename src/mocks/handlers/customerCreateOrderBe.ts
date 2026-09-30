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
  CustomerConsultation,
  ServiceDeliverableOption,
  ServiceRequirementSuggestion,
} from '../../features/customer/api/customerApi'
import type { OrderCreateResponse } from '../../features/customer/api/orderApi'
import { createCollection } from '../db'
import { created, fail, ok, registerMockRoutes } from '../mockServer'
import { createdOrders } from './customerOrdersStore'

type CategoryService = { id: string; name: string; description?: string }

const SERVICE_PRICES: Record<string, number> = {
  'svc-1': 1_500_000,
  'svc-2': 3_200_000,
}
const DEFAULT_SERVICE_PRICE = 2_000_000
const AI_ANALYSIS_PRICE = 500_000

// Mirrors ServiceCatalogSeedDataInitializer.seedServiceDeliverables.
const deliverables: ServiceDeliverableOption[] = [
  { id: 'sd-1', serviceId: 'svc-4', serviceName: 'Giám sát Kho bãi / Logistics', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-2', serviceId: 'svc-4', serviceName: 'Giám sát Kho bãi / Logistics', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-3', serviceId: 'svc-4', serviceName: 'Giám sát Kho bãi / Logistics', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-4', serviceId: 'svc-5', serviceName: 'Giám sát Đập nước / Hồ chứa', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-5', serviceId: 'svc-5', serviceName: 'Giám sát Đập nước / Hồ chứa', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-6', serviceId: 'svc-5', serviceName: 'Giám sát Đập nước / Hồ chứa', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-7', serviceId: 'svc-5', serviceName: 'Giám sát Đập nước / Hồ chứa', deliverableTypeId: 'dt-thermal', deliverableTypeName: 'Báo cáo Phân tích Nhiệt' },
  { id: 'sd-8', serviceId: 'svc-6', serviceName: 'Giám sát Rừng / Điểm nhiệt', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-9', serviceId: 'svc-6', serviceName: 'Giám sát Rừng / Điểm nhiệt', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-10', serviceId: 'svc-6', serviceName: 'Giám sát Rừng / Điểm nhiệt', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-11', serviceId: 'svc-6', serviceName: 'Giám sát Rừng / Điểm nhiệt', deliverableTypeId: 'dt-thermal', deliverableTypeName: 'Báo cáo Phân tích Nhiệt' },
  { id: 'sd-12', serviceId: 'svc-3', serviceName: 'Giám sát Nông nghiệp / Cây trồng', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-13', serviceId: 'svc-3', serviceName: 'Giám sát Nông nghiệp / Cây trồng', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-14', serviceId: 'svc-3', serviceName: 'Giám sát Nông nghiệp / Cây trồng', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-15', serviceId: 'svc-8', serviceName: 'Giám sát Kho công nghiệp / Nhà xưởng', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-16', serviceId: 'svc-8', serviceName: 'Giám sát Kho công nghiệp / Nhà xưởng', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-17', serviceId: 'svc-8', serviceName: 'Giám sát Kho công nghiệp / Nhà xưởng', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-18', serviceId: 'svc-8', serviceName: 'Giám sát Kho công nghiệp / Nhà xưởng', deliverableTypeId: 'dt-thermal', deliverableTypeName: 'Báo cáo Phân tích Nhiệt' },
  { id: 'sd-19', serviceId: 'svc-9', serviceName: 'Giám sát Mặt nước / Dòng chảy', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-20', serviceId: 'svc-9', serviceName: 'Giám sát Mặt nước / Dòng chảy', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-21', serviceId: 'svc-9', serviceName: 'Giám sát Mặt nước / Dòng chảy', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-22', serviceId: 'svc-10', serviceName: 'Đo nhiệt độ / Điểm nhiệt', deliverableTypeId: 'dt-thermal', deliverableTypeName: 'Báo cáo Phân tích Nhiệt' },
  { id: 'sd-23', serviceId: 'svc-10', serviceName: 'Đo nhiệt độ / Điểm nhiệt', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-24', serviceId: 'svc-10', serviceName: 'Đo nhiệt độ / Điểm nhiệt', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-25', serviceId: 'svc-11', serviceName: 'Đo nhiệt độ / Áp suất', deliverableTypeId: 'dt-temp', deliverableTypeName: 'Báo cáo Nhiệt độ / Áp suất' },
  { id: 'sd-26', serviceId: 'svc-11', serviceName: 'Đo nhiệt độ / Áp suất', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-27', serviceId: 'svc-11', serviceName: 'Đo nhiệt độ / Áp suất', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-28', serviceId: 'svc-12', serviceName: 'Kiểm tra Công trình thủy lợi', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-29', serviceId: 'svc-12', serviceName: 'Kiểm tra Công trình thủy lợi', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-30', serviceId: 'svc-12', serviceName: 'Kiểm tra Công trình thủy lợi', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-31', serviceId: 'svc-2', serviceName: 'Giám sát Tiến độ Xây dựng', deliverableTypeId: 'dt-progress', deliverableTypeName: 'Báo cáo Tiến độ' },
  { id: 'sd-32', serviceId: 'svc-2', serviceName: 'Giám sát Tiến độ Xây dựng', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-33', serviceId: 'svc-2', serviceName: 'Giám sát Tiến độ Xây dựng', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-34', serviceId: 'svc-13', serviceName: 'Giám sát Sạt lở / Ngập lụt', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-35', serviceId: 'svc-13', serviceName: 'Giám sát Sạt lở / Ngập lụt', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-36', serviceId: 'svc-13', serviceName: 'Giám sát Sạt lở / Ngập lụt', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
  { id: 'sd-37', serviceId: 'svc-1', serviceName: 'Kiểm tra Tháp viễn thông', deliverableTypeId: 'dt-report', deliverableTypeName: 'Báo cáo Giám sát' },
  { id: 'sd-38', serviceId: 'svc-1', serviceName: 'Kiểm tra Tháp viễn thông', deliverableTypeId: 'dt-photo', deliverableTypeName: 'Hình ảnh Kiểm tra' },
  { id: 'sd-39', serviceId: 'svc-1', serviceName: 'Kiểm tra Tháp viễn thông', deliverableTypeId: 'dt-video', deliverableTypeName: 'Video Ghi hình' },
]

const suggestions: ServiceRequirementSuggestion[] = [
  { id: 'rs-1', serviceId: 'svc-1', category: 'TARGET', label: 'Kiểm tra tháp', message: 'Kiểm tra anten và kết cấu tháp viễn thông.', sortOrder: 1, source: 'SEED' },
  { id: 'rs-2', serviceId: 'svc-2', category: 'TARGET', label: 'Tiến độ', message: 'Chụp ảnh tiến độ thi công định kỳ.', sortOrder: 1, source: 'SEED' },
]

const categoryServices: CategoryService[] = [
  { id: 'cat-1', name: 'Giám sát công trình', description: 'Theo dõi tiến độ, chụp định kỳ, so sánh theo tuần/tháng và phát hiện khu vực thi công chậm.' },
  { id: 'cat-2', name: 'Giám sát nông nghiệp', description: 'Kiểm tra cây trồng, vùng thiếu nước, sâu bệnh, stress thực vật và theo dõi diện tích canh tác.' },
  { id: 'cat-3', name: 'Giám sát khu công nghiệp / nhà máy', description: 'Kiểm tra mái nhà, bồn chứa, khu vực nguy hiểm, hàng rào và tài sản ngoài trời.' },
  { id: 'cat-4', name: 'Giám sát an ninh khu vực', description: 'Tuần tra theo tuyến, phát hiện người/phương tiện và kiểm tra xâm nhập vùng giới hạn.' },
  { id: 'cat-5', name: 'Giám sát giao thông', description: 'Theo dõi mật độ xe, ùn tắc, luồng di chuyển và sự cố giao thông.' },
  { id: 'cat-6', name: 'Giám sát môi trường', description: 'Phát hiện sạt lở, ngập lụt, cháy, thay đổi mặt nước, rác thải hoặc biến động địa hình.' },
  { id: 'cat-7', name: 'Giám sát điện / hạ tầng', description: 'Kiểm tra đường dây điện, cột điện, trạm biến áp, pin mặt trời và đường ống.' },
  { id: 'cat-8', name: 'Giám sát kho bãi / logistics', description: 'Giám sát bãi container, bãi xe, khu tập kết vật tư và kiểm kê khu vực ngoài trời.' },
  { id: 'cat-9', name: 'Giám sát sự kiện / khu đông người', description: 'Quan sát tổng thể khu vực, mật độ người và các điểm bất thường.' },
  { id: 'cat-10', name: 'Giám sát theo yêu cầu định kỳ', description: 'Khách chọn khu vực và tần suất bay hằng ngày/tuần/tháng để nhận báo cáo tự động.' },
]

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
  { id: 'zone-mon', code: 'MON-1', name: 'Khu giám sát A', zoneType: 'MONITORING', restricted: false, coordinates: square(0, 1000) },
  { id: 'zone-nofly', code: 'NOFLY-1', name: 'Vùng cấm sân bay', zoneType: 'RESTRICTED', restricted: true, coordinates: square(500, 600) },
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
      return ok(serviceId ? suggestions.filter((s) => s.serviceId === serviceId) : suggestions)
    },
  },
  {
    method: 'GET',
    path: '/api/service-deliverables',
    handler: ({ query }) => {
      const serviceId = query.get('serviceId')
      const typeId = query.get('deliverableTypeId')
      return ok(
        deliverables.filter(
          (d) =>
            (!serviceId || d.serviceId === serviceId) &&
            (!typeId || d.deliverableTypeId === typeId),
        ),
      )
    },
  },
  { method: 'GET', path: '/api/zones', handler: () => ok([...zones]) },
  { method: 'GET', path: '/api/category-services', handler: () => ok([...categoryServices]) },
  {
    method: 'POST',
    path: '/api/orders',
    handler: ({ body }) => {
      const b = (body ?? {}) as Record<string, unknown>
      const errors: Record<string, string> = {}
      for (const key of REQUIRED) {
        const value = b[key]
        if (value === undefined || value === null || value === '') errors[key] = `${key} is required`
      }
      if (Array.isArray(b.deliverables) && b.deliverables.length === 0) {
        errors.deliverables = 'deliverables must not be empty'
      }
      if (Object.keys(errors).length) {
        return fail(400, 'VALIDATION_ERROR', 'Validation failed', errors)
      }
      const now = new Date().toISOString()
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
        deliverables: (b.deliverables as Array<Record<string, unknown>>).map((d, i) => ({
          id: `od-${i + 1}`,
          deliverableTypeId: String(d.deliverableTypeId),
          requirement: (d.requirement as Record<string, unknown>) ?? {},
        })),
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
      const text = String((body as { message?: string } | undefined)?.message ?? '').trim()
      if (!text) {
        return fail(400, 'VALIDATION_ERROR', 'Validation failed', { message: 'message is required' })
      }
      found.messages = [
        ...(found.messages ?? []),
        { id: nextId('msg'), senderType: 'CUSTOMER', message: text },
        { id: nextId('msg'), senderType: 'ASSISTANT', message: 'Mình gợi ý dịch vụ Giám sát Tiến độ Xây dựng.' },
      ]
      found.status = 'READY_FOR_CONFIRMATION'
      found.recommendedServiceId = 'svc-2'
      found.recommendedServiceName = 'Giám sát Tiến độ Xây dựng'
      found.requirementSummary = text
      found.requestTitle = 'Giám sát Tiến độ Xây dựng'
      found.requestSummary = text
      return ok(found)
    },
  },
])
