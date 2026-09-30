// Mock handlers for Admin operating config APIs:
//   GET   /api/admin/config/policies
//   PATCH /api/admin/config/policies/:id
//   GET   /api/admin/config/weights
//   PUT   /api/admin/config/weights
//   GET   /api/admin/config/no-fly-zones
//   POST  /api/admin/config/no-fly-zones
//   PATCH /api/admin/config/no-fly-zones/:id
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import seedData from '../data/admin-config.json'

type PolicySeed = (typeof seedData.policies)[number]
type WeightSeed = (typeof seedData.dispatchWeights)[number]
type ZoneSeed = (typeof seedData.noFlyZones)[number]

const policies = createCollection(seedData.policies as PolicySeed[]) as unknown as PolicySeed[]
const weights = createCollection(seedData.dispatchWeights as WeightSeed[]) as unknown as WeightSeed[]
const zones = createCollection(seedData.noFlyZones as ZoneSeed[]) as unknown as ZoneSeed[]

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/admin/config/policies',
    handler: () => ok({ items: [...policies] }),
  },

  {
    method: 'PATCH',
    path: '/api/admin/config/policies/:id',
    handler: ({ params, body }) => {
      const policy = policies.find((p) => p.id === params.id)
      if (!policy) return fail(404, 'NOT_FOUND', 'Không tìm thấy tham số.')
      const payload = body as { value?: string }
      if (payload.value !== undefined) policy.value = payload.value
      return ok(policy)
    },
  },

  {
    method: 'GET',
    path: '/api/admin/config/weights',
    handler: () => ok({ items: [...weights] }),
  },

  {
    method: 'PUT',
    path: '/api/admin/config/weights',
    handler: ({ body }) => {
      const payload = body as { group: string; weights: Array<{ key: string; value: number }> }
      if (!payload.group || !Array.isArray(payload.weights))
        return fail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ.')
      const sum = payload.weights.reduce((acc, w) => acc + w.value, 0)
      if (sum !== 100)
        return fail(422, 'WEIGHT_SUM_ERROR', `Tổng trọng số phải bằng 100%, hiện tại: ${sum}%.`)
      for (const w of payload.weights) {
        const existing = weights.find((ew) => ew.key === w.key)
        if (existing) existing.value = w.value
      }
      return ok({ items: weights.filter((w) => w.group === payload.group) })
    },
  },

  {
    method: 'GET',
    path: '/api/admin/config/no-fly-zones',
    handler: () => ok({ items: [...zones] }),
  },

  {
    method: 'POST',
    path: '/api/admin/config/no-fly-zones',
    handler: ({ body }) => {
      const payload = body as Partial<ZoneSeed>
      if (!payload.name?.trim())
        return fail(400, 'VALIDATION_ERROR', 'Tên vùng cấm bay là bắt buộc.', { name: 'Bắt buộc' })
      const newZone = {
        id: `nfz-new-${Date.now()}`,
        name: payload.name.trim(),
        source: payload.source ?? '',
        zoneType: payload.zoneType ?? 'RESTRICTED',
        lat: payload.lat ?? 0,
        lon: payload.lon ?? 0,
        radiusM: payload.radiusM ?? 500,
        maxAltitudeM: payload.maxAltitudeM ?? null,
        effectiveFrom: payload.effectiveFrom ?? new Date().toISOString().slice(0, 10),
        effectiveTo: payload.effectiveTo ?? null,
        isActive: true,
      }
      zones.push(newZone as ZoneSeed)
      return ok(newZone)
    },
  },

  {
    method: 'PATCH',
    path: '/api/admin/config/no-fly-zones/:id',
    handler: ({ params, body }) => {
      const zone = zones.find((z) => z.id === params.id)
      if (!zone) return fail(404, 'NOT_FOUND', 'Không tìm thấy vùng cấm bay.')
      Object.assign(zone, body)
      return ok(zone)
    },
  },
])
