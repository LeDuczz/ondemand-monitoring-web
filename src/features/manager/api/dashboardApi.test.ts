import { afterEach, describe, expect, it } from 'vitest'

import { stubApi } from '../../../test/stubApi'
import { managerApi } from './dashboardApi'

// The dashboard endpoint is served by the real backend (no mock route), so
// this asserts the request against a stubbed transport.
describe('managerApi.getDashboard', () => {
  let stub: ReturnType<typeof stubApi>
  afterEach(() => stub?.restore())

  it('GETs /api/manager/dashboard and returns the payload', async () => {
    const payload = { kpis: { pendingOrders: { count: 6 } }, actionItems: [] }
    stub = stubApi([{ path: '/api/manager/dashboard', respond: payload }])

    const data = await managerApi.getDashboard()

    expect(data).toEqual(payload)
    expect(stub.calls).toHaveLength(1)
    expect(stub.calls[0]).toMatchObject({
      method: 'GET',
      path: '/api/manager/dashboard',
    })
  })
})
