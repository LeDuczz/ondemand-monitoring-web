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
    expect(result.totalItems).toBeGreaterThan(0)
  })

  it('filters by status', async () => {
    const result = await dronesApi.listDrones({ status: 'AVAILABLE' })
    for (const item of result.items) {
      expect(item.status).toBe('AVAILABLE')
    }
  })
})

describe('dronesApi.updateDrone', () => {
  it('updates drone status', async () => {
    const result = await dronesApi.updateDrone('drn-01', {
      serialNumber: 'SN001',
      droneModelId: 'model1',
      dronePayloadId: 'payload1',
      status: 'MAINTENANCE',
    })
    expect(result.status).toBe('MAINTENANCE')
  })

  it('throws on unknown drone', async () => {
    await expect(
      dronesApi.updateDrone('nonexistent', {
        serialNumber: 'SN999',
        droneModelId: 'model1',
        dronePayloadId: 'payload1',
        status: 'AVAILABLE',
      }),
    ).rejects.toThrow()
  })
})
