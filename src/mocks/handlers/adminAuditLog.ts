// Mock handlers for Admin audit log APIs:
//   GET /api/admin/audit-log[?actorId=&action=&entityType=&from=&to=&page=&limit=]
import { createCollection } from '../db'
import { ok, registerMockRoutes } from '../mockServer'
import seedData from '../data/admin-audit-log.json'

type EntrySeed = (typeof seedData.entries)[number]

const entries = createCollection(seedData.entries as EntrySeed[]) as unknown as EntrySeed[]

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/admin/audit-log',
    handler: ({ query }) => {
      let filtered = [...entries] as EntrySeed[]
      const actorId = query.get('actorId')
      const action = query.get('action')
      const entityType = query.get('entityType')
      const from = query.get('from')
      const to = query.get('to')

      if (actorId) filtered = filtered.filter((e) => e.actorId === actorId)
      if (action) filtered = filtered.filter((e) => e.action === action)
      if (entityType) filtered = filtered.filter((e) => e.entityType === entityType)
      if (from) filtered = filtered.filter((e) => e.createdAt >= from)
      if (to) filtered = filtered.filter((e) => e.createdAt <= `${to}T23:59:59`)

      filtered.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )

      const total = filtered.length
      const limit = parseInt(query.get('limit') ?? '10', 10)
      const page = parseInt(query.get('page') ?? '1', 10)
      const start = (page - 1) * limit
      const items = filtered.slice(start, start + limit)

      return ok({ items, total, page, limit })
    },
  },
])
