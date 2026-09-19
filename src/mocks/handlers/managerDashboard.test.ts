import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../config/env'
import { resetMockDb } from '../db'
import { mockFetch } from '../mockServer'
import './managerDashboard'

beforeEach(() => {
  resetMockDb()
})

afterEach(() => {
  resetMockDb()
})

describe('GET /api/manager/dashboard', () => {
  it('returns the dashboard envelope with KPI, chart, donut and action-item data', async () => {
    const response = await mockFetch(`${env.apiBaseUrl}/api/manager/dashboard`)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.kpis.pendingOrders).toEqual({
      count: 6,
      detail: '2 quá 24h',
    })
    expect(payload.data.kpis.dronesReady).toEqual({
      ready: 5,
      total: 9,
      detail: '1 bảo trì',
    })
    expect(payload.data.missionStatusByDay).toHaveLength(7)
    expect(payload.data.droneStatusBreakdown).toHaveLength(5)
    expect(
      payload.data.droneStatusBreakdown.reduce(
        (sum: number, entry: { count: number }) => sum + entry.count,
        0,
      ),
    ).toBe(9)
    expect(payload.data.actionItems).toHaveLength(6)
    expect(payload.data.flyingMission.missionId).toBe('MSN-2609-0142-1')
  })

  it('serves the same in-memory collection identity across requests (mutable mock db)', async () => {
    const first = await (
      await mockFetch(`${env.apiBaseUrl}/api/manager/dashboard`)
    ).json()
    const second = await (
      await mockFetch(`${env.apiBaseUrl}/api/manager/dashboard`)
    ).json()
    expect(first.data.kpis.pendingOrders.count).toBe(
      second.data.kpis.pendingOrders.count,
    )
  })
})
