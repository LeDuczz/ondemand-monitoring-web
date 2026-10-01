// Mock handlers in the BE DTO shape (ApiResponse envelope) for:
//   GET/POST        /api/services            [BE shape]
//   GET/PUT/DELETE  /api/services/:id        [BE shape]
//   GET/POST        /api/preferred-times     [BE shape]
//   GET/PUT/DELETE  /api/preferred-times/:id [BE shape]
import type {
  PreferredTimeResponse,
  ServiceResponse,
} from '../../features/admin/api/catalogApi'
import { createCollection } from '../db'
import { created, fail, ok, registerMockRoutes } from '../mockServer'

const TIME_CODES = ['MORNING', 'AFTERNOON', 'EVENING', 'NIGHT']

const services = createCollection<ServiceResponse[]>([
  {
    id: 'svc-1',
    name: 'Kiểm tra Tháp viễn thông',
    description: 'Kiểm tra tháp viễn thông, anten, kết cấu cao, thiết bị gắn trên tháp và khu vực xung quanh từ góc nhìn an toàn.',
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-2',
    name: 'Giám sát Tiến độ Xây dựng',
    description: 'Theo dõi công trình xây dựng, công trường, tiến độ thi công và hiện trạng khu vực làm việc bằng ảnh/video.',
    isActive: true,
    createdAt: '2026-01-11T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-3',
    name: 'Giám sát Nông nghiệp / Cây trồng',
    description: 'Giám sát khu canh tác, sức khỏe cây trồng, khu vực phát triển không đồng đều, dấu hiệu khô hạn và bất thường mùa vụ.',
    isActive: false,
    createdAt: '2026-01-12T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-4',
    name: 'Giám sát Kho bãi / Logistics',
    description: 'Giám sát bãi logistics, container, khu bốc xếp, luồng xe ra vào và khu vực lưu trữ ngoài trời bằng drone.',
    isActive: true,
    createdAt: '2026-01-13T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-5',
    name: 'Giám sát Đập nước / Hồ chứa',
    description: 'Giám sát khu vực đập nước, hồ chứa, cửa xả, thân đập và vùng thượng/hạ lưu; bàn giao ảnh/video hiện trạng và báo cáo kèm hình.',
    isActive: true,
    createdAt: '2026-01-14T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-6',
    name: 'Giám sát Rừng / Điểm nhiệt',
    description: 'Giám sát khu rừng, thảm thực vật, khu vực tìm kiếm và điểm nhiệt có nguy cơ cháy bằng ảnh/video và dữ liệu nhiệt.',
    isActive: true,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-7',
    name: 'Kiểm tra Sân bay / Đường băng',
    description: 'Kiểm tra đường băng, sân đỗ, khu vực vận hành máy bay và vùng hạn chế để hỗ trợ giám sát an toàn.',
    isActive: true,
    createdAt: '2026-01-16T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-8',
    name: 'Giám sát Kho công nghiệp / Nhà xưởng',
    description: 'Giám sát kho công nghiệp, mái nhà, bồn chứa, sân bãi và tài sản ngoài trời bằng ảnh/video drone.',
    isActive: true,
    createdAt: '2026-01-17T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-9',
    name: 'Giám sát Mặt nước / Dòng chảy',
    description: 'Theo dõi mặt nước, dòng chảy và bờ sông/kênh trên bản đồ mô phỏng; bàn giao ảnh/video và báo cáo giám sát.',
    isActive: true,
    createdAt: '2026-01-18T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-10',
    name: 'Đo nhiệt độ / Điểm nhiệt',
    description: 'Đo nhiệt độ và ghi nhận ảnh nhiệt trong khu vực giám sát; bàn giao ảnh nhiệt và báo cáo phân tích nhiệt.',
    isActive: true,
    createdAt: '2026-01-19T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-11',
    name: 'Đo nhiệt độ / Áp suất',
    description: 'Theo dõi nhiệt độ và áp suất khí quyển theo khu vực bay, hỗ trợ đánh giá điều kiện môi trường và rủi ro vận hành device.',
    isActive: true,
    createdAt: '2026-01-20T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-12',
    name: 'Kiểm tra Công trình thủy lợi',
    description: 'Kiểm tra cầu, kè, cống, đường nội bộ, nhà điều hành và hạng mục kỹ thuật quanh khu vực đập/hồ bằng ảnh/video.',
    isActive: true,
    createdAt: '2026-01-21T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-13',
    name: 'Giám sát Sạt lở / Ngập lụt',
    description: 'Giám sát khu vực sạt lở, ngập lụt, tuyến đường bị chặn, dòng chảy bất thường và thay đổi địa hình sau mưa lũ.',
    isActive: true,
    createdAt: '2026-01-22T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-14',
    name: 'Giám sát Mục tiêu xa',
    description: 'Giám sát mục tiêu ở khoảng cách xa bằng waypoint, bay vòng quan sát, ghi nhận hiện trạng và kiểm tra khu vực khó tiếp cận.',
    isActive: true,
    createdAt: '2026-01-23T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-15',
    name: 'Giám sát Bãi đáp / Trạm drone',
    description: 'Giám sát bãi đáp, khu vực cất hạ cánh, điểm quay về, hành lang an toàn và trạng thái khu vực vận hành drone.',
    isActive: true,
    createdAt: '2026-01-24T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
])

const times = createCollection<PreferredTimeResponse[]>([
  { id: 'pt-1', code: 'MORNING', name: 'Buổi sáng', startTime: '06:00:00', endTime: '12:00:00' },
  { id: 'pt-2', code: 'AFTERNOON', name: 'Buổi chiều', startTime: '12:00:00', endTime: '17:00:00' },
  { id: 'pt-3', code: 'EVENING', name: 'Buổi tối', startTime: '17:00:00', endTime: '20:00:00' },
])

let seq = 100
const notFound = (what: string) => fail(404, 'NOT_FOUND', `${what} not found`)

type ServiceBody = { name?: string; description?: string; isActive?: boolean }
type TimeBody = {
  code?: string
  name?: string
  startTime?: string
  endTime?: string
}

function validateService(b: ServiceBody) {
  return b.name?.trim()
    ? null
    : fail(400, 'VALIDATION_ERROR', 'Validation failed', {
        name: 'Name is required',
      })
}

function validateTime(b: TimeBody, requireAll: boolean) {
  const errors: Record<string, string> = {}
  if (requireAll) {
    for (const k of ['code', 'name', 'startTime', 'endTime'] as const) {
      if (!b[k]) errors[k] = `${k} is required`
    }
  }
  if (b.code && !TIME_CODES.includes(b.code)) errors.code = 'Invalid code'
  return Object.keys(errors).length
    ? fail(400, 'VALIDATION_ERROR', 'Validation failed', errors)
    : null
}

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/services',
    handler: ({ query }) =>
      ok(
        query.get('activeOnly') === 'true'
          ? services.filter((s) => s.isActive)
          : [...services],
      ),
  },
  {
    method: 'POST',
    path: '/api/services',
    handler: ({ body }) => {
      const b = (body ?? {}) as ServiceBody
      const invalid = validateService(b)
      if (invalid) return invalid
      const now = new Date().toISOString()
      const svc: ServiceResponse = {
        id: `svc-${++seq}`,
        name: b.name!.trim(),
        description: b.description ?? '',
        isActive: b.isActive ?? true,
        createdAt: now,
        updatedAt: now,
      }
      services.push(svc)
      return created(svc)
    },
  },
  {
    method: 'GET',
    path: '/api/services/:id',
    handler: ({ params }) => {
      const svc = services.find((s) => s.id === params.id)
      return svc ? ok(svc) : notFound('Service')
    },
  },
  {
    method: 'PUT',
    path: '/api/services/:id',
    handler: ({ params, body }) => {
      const svc = services.find((s) => s.id === params.id)
      if (!svc) return notFound('Service')
      const b = (body ?? {}) as ServiceBody
      const invalid = validateService(b)
      if (invalid) return invalid
      svc.name = b.name!.trim()
      svc.description = b.description ?? ''
      svc.isActive = b.isActive ?? svc.isActive
      svc.updatedAt = new Date().toISOString()
      return ok(svc)
    },
  },
  {
    method: 'DELETE',
    path: '/api/services/:id',
    handler: ({ params }) => {
      const i = services.findIndex((s) => s.id === params.id)
      if (i < 0) return notFound('Service')
      services.splice(i, 1)
      return ok(null)
    },
  },

  { method: 'GET', path: '/api/preferred-times', handler: () => ok([...times]) },
  {
    method: 'POST',
    path: '/api/preferred-times',
    handler: ({ body }) => {
      const b = (body ?? {}) as TimeBody
      const invalid = validateTime(b, true)
      if (invalid) return invalid
      if (times.some((t) => t.code === b.code))
        return fail(409, 'CONFLICT', 'Preferred time code already exists', {
          code: 'Code already exists',
        })
      const pt = { id: `pt-${++seq}`, ...b } as PreferredTimeResponse
      times.push(pt)
      return created(pt)
    },
  },
  {
    method: 'GET',
    path: '/api/preferred-times/:id',
    handler: ({ params }) => {
      const pt = times.find((t) => t.id === params.id)
      return pt ? ok(pt) : notFound('Preferred time')
    },
  },
  {
    method: 'PUT',
    path: '/api/preferred-times/:id',
    handler: ({ params, body }) => {
      const pt = times.find((t) => t.id === params.id)
      if (!pt) return notFound('Preferred time')
      const b = (body ?? {}) as TimeBody
      const invalid = validateTime(b, false)
      if (invalid) return invalid
      Object.assign(pt, b)
      return ok(pt)
    },
  },
  {
    method: 'DELETE',
    path: '/api/preferred-times/:id',
    handler: ({ params }) => {
      const i = times.findIndex((t) => t.id === params.id)
      if (i < 0) return notFound('Preferred time')
      times.splice(i, 1)
      return ok(null)
    },
  },
])
