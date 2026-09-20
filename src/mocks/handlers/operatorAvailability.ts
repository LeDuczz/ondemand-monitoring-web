import { registerMockRoutes, ok, fail } from '../mockServer'
import availabilityData from '../data/operator-availability.json'
import type { AvailabilitySlot, MissionOverlay } from '../../features/drone-operator/omss/types'

type AvailabilityStore = {
  week: string
  slots: AvailabilitySlot[]
  missionOverlays: MissionOverlay[]
}

// Mutable in-memory store keyed by week string
const store: Record<string, AvailabilityStore> = {
  [availabilityData.week]: {
    week: availabilityData.week,
    slots: availabilityData.slots as AvailabilitySlot[],
    missionOverlays: availabilityData.missionOverlays as MissionOverlay[],
  },
}

function emptyWeek(week: string): AvailabilityStore {
  return { week, slots: [], missionOverlays: [] }
}

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/operator/availability',
    handler: ({ query }) => {
      const week = query.get('week')
      if (!week) return fail(400, 'BAD_REQUEST', 'Thiếu tham số week')
      const data = store[week] ?? emptyWeek(week)
      return ok(data)
    },
  },

  {
    method: 'PUT',
    path: '/api/operator/availability',
    handler: ({ body }) => {
      const payload = body as { week?: string; slots?: AvailabilitySlot[] }
      if (!payload?.week) return fail(400, 'BAD_REQUEST', 'Thiếu trường week')
      const existing = store[payload.week] ?? emptyWeek(payload.week)
      store[payload.week] = {
        ...existing,
        week: payload.week,
        slots: payload.slots ?? existing.slots,
      }
      return ok(store[payload.week])
    },
  },
])
