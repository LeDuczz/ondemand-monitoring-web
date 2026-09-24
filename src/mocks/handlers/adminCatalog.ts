// Mock handlers for Admin catalog APIs:
//   GET   /api/admin/catalog/services
//   PATCH /api/admin/catalog/services/:id
//   GET   /api/admin/catalog/timeslots
//   POST  /api/admin/catalog/timeslots
//   GET   /api/admin/catalog/stations
//   POST  /api/admin/catalog/stations
//   PATCH /api/admin/catalog/stations/:id
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import seedData from '../data/admin-catalog.json'

type ServiceSeed = (typeof seedData.services)[number]
type TimeslotSeed = (typeof seedData.timeslots)[number]
type StationSeed = (typeof seedData.stations)[number]

const services = createCollection(seedData.services as ServiceSeed[]) as unknown as ServiceSeed[]
const timeslots = createCollection(seedData.timeslots as TimeslotSeed[]) as unknown as TimeslotSeed[]
const stations = createCollection(seedData.stations as StationSeed[]) as unknown as StationSeed[]

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/admin/catalog/services',
    handler: () => ok({ items: [...services] }),
  },

  {
    method: 'PATCH',
    path: '/api/admin/catalog/services/:id',
    handler: ({ params, body }) => {
      const svc = services.find((s) => s.id === params.id)
      if (!svc) return fail(404, 'NOT_FOUND', 'Không tìm thấy dịch vụ.')
      const payload = body as Partial<ServiceSeed>
      if (payload.name !== undefined) svc.name = payload.name
      if (payload.description !== undefined) svc.description = payload.description
      if (payload.defaultDurationMin !== undefined) svc.defaultDurationMin = payload.defaultDurationMin
      if (payload.minAltitudeM !== undefined) svc.minAltitudeM = payload.minAltitudeM
      if (payload.maxAltitudeM !== undefined) svc.maxAltitudeM = payload.maxAltitudeM
      if (payload.sensors !== undefined) svc.sensors = payload.sensors
      if (payload.isActive !== undefined) svc.isActive = payload.isActive
      return ok(svc)
    },
  },

  {
    method: 'GET',
    path: '/api/admin/catalog/timeslots',
    handler: () => ok({ items: [...timeslots] }),
  },

  {
    method: 'POST',
    path: '/api/admin/catalog/timeslots',
    handler: ({ body }) => {
      const payload = body as { code?: string; name?: string; startTime?: string; endTime?: string; effectiveFrom?: string }
      if (!payload.code?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Mã khung giờ là bắt buộc.', { code: 'Bắt buộc' })
      if (!payload.effectiveFrom)
        return fail(400, 'VALIDATION_ERROR', 'Ngày hiệu lực là bắt buộc.', { effectiveFrom: 'Bắt buộc' })
      // Close previous version for same code
      for (const ts of timeslots) {
        if (ts.code === payload.code && ts.effectiveTo === null) {
          const prevDate = new Date(payload.effectiveFrom)
          prevDate.setDate(prevDate.getDate() - 1)
          ;(ts as { effectiveTo: string | null }).effectiveTo = prevDate.toISOString().slice(0, 10)
        }
      }
      const existing = timeslots.filter((t) => t.code === payload.code)
      const version = `${existing.length + 1}.0`
      const newTs = {
        id: `ts-${payload.code?.toLowerCase()}-v${existing.length + 1}`,
        code: payload.code!.trim(),
        name: payload.name?.trim() ?? payload.code!.trim(),
        version,
        startTime: payload.startTime ?? '06:00',
        endTime: payload.endTime ?? '18:00',
        effectiveFrom: payload.effectiveFrom,
        effectiveTo: null,
      }
      timeslots.push(newTs as TimeslotSeed)
      return ok(newTs)
    },
  },

  {
    method: 'GET',
    path: '/api/admin/catalog/stations',
    handler: () => ok({ items: [...stations] }),
  },

  {
    method: 'POST',
    path: '/api/admin/catalog/stations',
    handler: ({ body }) => {
      const payload = body as { code?: string; name?: string; address?: string; lat?: number; lon?: number; maxServiceRadiusM?: number }
      if (!payload.code?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Mã trạm là bắt buộc.', { code: 'Bắt buộc' })
      if (!payload.name?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Tên trạm là bắt buộc.', { name: 'Bắt buộc' })
      if (stations.find((s) => s.code === payload.code?.trim()))
        return fail(409, 'CODE_EXISTS', 'Mã trạm đã tồn tại.')
      const newStation = {
        id: `sta-new-${Date.now()}`,
        code: payload.code.trim(),
        name: payload.name.trim(),
        address: payload.address ?? '',
        lat: payload.lat ?? 0,
        lon: payload.lon ?? 0,
        maxServiceRadiusM: payload.maxServiceRadiusM ?? 5000,
        isActive: true,
      }
      stations.push(newStation as StationSeed)
      return ok(newStation)
    },
  },

  {
    method: 'PATCH',
    path: '/api/admin/catalog/stations/:id',
    handler: ({ params, body }) => {
      const station = stations.find((s) => s.id === params.id)
      if (!station) return fail(404, 'NOT_FOUND', 'Không tìm thấy trạm.')
      const payload = body as Partial<StationSeed>
      Object.assign(station, payload)
      return ok(station)
    },
  },
])
