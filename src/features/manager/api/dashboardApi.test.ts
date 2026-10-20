import { afterEach, describe, expect, it } from 'vitest'

import {
  resetHttpTransport,
  setHttpTransport,
} from '../../../shared/api/httpClient'
import { resetMockDb } from '../../../mocks/db'
import { mockFetch } from '../../../mocks'
import { managerApi } from './dashboardApi'

// Exercises `managerApi.getDashboard()` through the real mock transport
// (mockFetch + the registered `managerDashboard` handler), not a stubbed
// response — this is the "API fn in mock mode" test AGENT-RULES.md asks for.
describe('managerApi.getDashboard (mock mode)', () => {
  afterEach(() => {
    resetHttpTransport()
    resetMockDb()
  })

  it('resolves the dashboard payload served by the mock handler', async () => {
    setHttpTransport(mockFetch)

    const data = await managerApi.getDashboard()

    expect(data.kpis.pendingOrders.count).toBe(6)
    expect(data.kpis.dronesReady).toEqual({
      ready: 5,
      total: 9,
      detail: '1 bảo trì',
    })
    expect(data.actionItems).toHaveLength(6)
    expect(data.flyingMission?.code).toBe('MSN-2609-0142-1')
  })
})
