// Mock handler for GET /api/manager/dashboard [TK MNG-01].
import type { ManagerDashboardResponse } from '../../features/manager/types/dashboard'
import { createCollection } from '../db'
import { ok, registerMockRoutes } from '../mockServer'
import seed from '../data/manager-dashboard.json'

const db = createCollection(seed as unknown as ManagerDashboardResponse)

registerMockRoutes([
  {
    method: 'GET',
    path: '/api/manager/dashboard',
    handler: () => ok<ManagerDashboardResponse>(db),
  },
])
