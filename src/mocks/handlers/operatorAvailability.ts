// Mock handlers for the Drone Operator availability grid (OPR-03W):
//   GET /api/operator/availability?week=YYYY-Www
//   PUT /api/operator/availability
import type { AvailabilityStatus } from '../../features/drone-operator/lib/availabilitySlots'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import seed from '../data/operator-availability.json'

type AvailabilityWeek = { week: string; slots: Record<string, AvailabilityStatus> }

const weeks = createCollection<Record<string, AvailabilityWeek>>({
  [seed.week]: seed as AvailabilityWeek,
})

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/operator/availability',
    handler: ({ query }) => {
      const week = query.get('week')
      if (!week) return fail(400, 'WEEK_REQUIRED', 'week query param is required')
      const record = weeks[week] ?? { week, slots: {} }
      return ok(record)
    },
  },
  {
    method: 'PUT',
    path: '/api/operator/availability',
    handler: ({ body }) => {
      const { week, slots } = (body ?? {}) as Partial<AvailabilityWeek>
      if (!week || !slots) return fail(400, 'INVALID_BODY', 'week and slots are required')
      weeks[week] = { week, slots }
      return ok(weeks[week])
    },
  },
])
