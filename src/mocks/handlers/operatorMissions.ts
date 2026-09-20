// Mock handlers for the Drone Operator portal (OPR-xxW):
//   GET /api/operator/profile
//   GET /api/operator/missions[?tab=pending|upcoming|history]
//   GET /api/operator/missions/:id
import { missionsByTab } from '../../features/drone-operator/lib/filterMissions'
import type {
  OperatorMission,
  OperatorMissionTab,
  OperatorProfile,
} from '../../features/drone-operator/types/mission'
import { createCollection } from '../db'
import { fail, ok, registerMockRoutes } from '../mockServer'
import seed from '../data/operator-missions.json'

const profile = seed.profile as OperatorProfile
const missions = createCollection(
  seed.missions as OperatorMission[],
) as unknown as OperatorMission[]

const TABS: OperatorMissionTab[] = ['pending', 'upcoming', 'history']

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/operator/profile',
    handler: () => ok(profile),
  },
  {
    method: 'GET',
    path: '/api/operator/missions',
    handler: ({ query }) => {
      const tab = query.get('tab') as OperatorMissionTab | null
      if (tab && !TABS.includes(tab)) {
        return fail(400, 'INVALID_TAB', `Unknown tab: ${tab}`)
      }
      const items = tab ? missionsByTab(missions, tab, new Date()) : missions
      return ok({ items })
    },
  },
  {
    method: 'GET',
    path: '/api/operator/missions/:id',
    handler: ({ params }) => {
      const mission = missions.find((m) => m.id === params.id)
      if (!mission) return fail(404, 'NOT_FOUND', 'Mission not found')
      return ok(mission)
    },
  },
])
