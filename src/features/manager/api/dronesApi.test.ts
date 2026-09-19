import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { env } from '../../../config/env'
import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { dronesApi } from './dronesApi'

// dronesApi uses apiRequest which calls mockFetch in test env
// Ensure env.useMockApi is truthy (set in test config)
beforeEach(() => {
  resetMockDb()
  void env.apiBaseUrl // ensure it's set
})
afterEach(() => resetMockDb())

describe('dronesApi.listDrones', () => {
  it('returns a list of drones', async () => {
    const result = await dronesApi.listDrones()
    expect(result.items.length).toBeGreaterThan(0)
    expect(result.total).toBeGreaterThan(0)
  })

  it('filters by status', async () => {
    const result = await dronesApi.listDrones({ status: 'AVAILABLE' })
    for (const item of result.items) {
      expect(item.status).toBe('AVAILABLE')
    }
  })
})

describe('dronesApi.patchDroneStatus', () => {
  it('updates drone status', async () => {
    const result = await dronesApi.patchDroneStatus('drn-01', 'MAINTENANCE', 'Bảo trì định kỳ')
    expect(result.status).toBe('MAINTENANCE')
  })

  it('throws on invalid transition', async () => {
    await expect(
      dronesApi.patchDroneStatus('drn-02', 'AVAILABLE', 'Test'),
    ).rejects.toThrow()
  })
})
