// Mock handlers for MNG-12. Endpoints:
//   GET /api/reports/summary   [TK]
import { ok, registerMockRoutes } from '../mockServer'
import reportsSeed from '../data/reports.json'

registerMockRoutes([
  // ── MNG-12: aggregated report summary [TK] ────────────────────────────
  {
    method: 'GET',
    path: '/api/reports/summary',
    handler: () => {
      return ok(reportsSeed.summary)
    },
  },
])
