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
    name: 'Kiểm tra mái nhà',
    description: 'Bay kiểm tra tình trạng mái và tấm pin.',
    isActive: true,
    createdAt: '2026-01-10T08:00:00Z',
    updatedAt: '2026-02-01T08:00:00Z',
  },
  {
    id: 'svc-2',
    name: 'Giám sát công trình',
    description: 'Chụp ảnh tiến độ định kỳ.',
    isActive: true,
    createdAt: '2026-01-12T08:00:00Z',
    updatedAt: '2026-01-12T08:00:00Z',
  },
  {
    id: 'svc-3',
    name: 'Khảo sát nông nghiệp',
    description: '',
    isActive: false,
    createdAt: '2026-01-15T08:00:00Z',
    updatedAt: '2026-03-05T08:00:00Z',
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
