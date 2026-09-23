import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resetMockDb } from '../db'
import '../index'
import { reportsApi } from '../../features/manager/api/reportsApi'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('GET /api/reports/summary', () => {
  it('returns summary with correct mission counts from design [TK MNG-12]', async () => {
    const summary = await reportsApi.getSummary()
    expect(summary.totalMissionsFlown).toBe(96)
    expect(summary.completedMissions).toBe(87)
    expect(summary.failedMissions).toBe(9)
  })

  it('returns success rate and utilization', async () => {
    const summary = await reportsApi.getSummary()
    expect(summary.successRate).toBe(91)
    expect(summary.avgFleetUtilizationPct).toBe(58)
  })

  it('has weekly data for 8 weeks (W29–W36)', async () => {
    const summary = await reportsApi.getSummary()
    expect(summary.weeklySuccessRate).toHaveLength(8)
    expect(summary.weeklySuccessRate[0].week).toBe('W29')
    expect(summary.weeklySuccessRate[7].week).toBe('W36')
  })

  it('has drone utilization list with correct values', async () => {
    const summary = await reportsApi.getSummary()
    expect(summary.droneUtilization.length).toBeGreaterThan(0)
    const drn1 = summary.droneUtilization.find((d) => d.droneCode === 'DRN-01')
    expect(drn1?.utilizationPct).toBe(72)
  })

  it('has service distribution summing to 48 orders', async () => {
    const summary = await reportsApi.getSummary()
    const total = summary.serviceDistribution.reduce((s, d) => s + d.count, 0)
    expect(total).toBe(48)
    expect(summary.totalOrders).toBe(48)
  })
})
