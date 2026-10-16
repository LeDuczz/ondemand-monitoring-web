// Test-only stub for `GET /api/missions`, which the real backend serves (so
// it has no mock route). Items come from the mission seeds; every endpoint
// that is still mocked (live telemetry, incidents, ...) falls through to
// mockFetch.
import { mockFetch } from '../../../mocks'
import calendarSeed from '../../../mocks/data/missions-calendar.json'
import missionsSeed from '../../../mocks/data/missions.json'
import { stubApi } from '../../../test/stubApi'

type SeedMission = {
  id: string
  status: string
  scheduledStartAt?: string | null
  scheduledEndAt?: string | null
}

export function stubMissionsList() {
  // The calendar seed carries richer display fields and wins on duplicate ids.
  const byId = new Map<string, SeedMission>()
  for (const m of missionsSeed.missions as SeedMission[]) byId.set(m.id, m)
  for (const m of calendarSeed.missions as unknown as SeedMission[])
    byId.set(m.id, m)
  const all = [...byId.values()]

  return stubApi(
    [
      {
        path: '/api/missions',
        respond: ({ query }) => {
          const from = query.get('from')
          const to = query.get('to')
          const status = query.get('status')
          const items = all.filter((m) => {
            if (status && m.status !== status) return false
            if (!from && !to) return true
            const start = m.scheduledStartAt
            const end = m.scheduledEndAt
            if (!start) return false
            if (from && end && end < from) return false
            if (to && start > `${to}T23:59:59`) return false
            return true
          })
          return { items }
        },
      },
    ],
    { fallback: mockFetch },
  )
}
