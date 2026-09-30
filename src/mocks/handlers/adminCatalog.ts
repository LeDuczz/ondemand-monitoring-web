// Mock handlers for Admin catalog stations (mock-only; services and
// timeslots live in catalogBe.ts):
//   GET   /api/admin/catalog/stations
//   POST  /api/admin/catalog/stations
//   PATCH /api/admin/catalog/stations/:id
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import seedData from '../data/admin-catalog.json'

type StationSeed = (typeof seedData.stations)[number]

const stations = createCollection(seedData.stations as StationSeed[]) as unknown as StationSeed[]

registerMockRoutes([
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
