import { afterEach, describe, expect, it } from 'vitest'

import { stubApi, stubError } from '../../../test/stubApi'
import { dronesApi } from './dronesApi'

// /api/drones is served by the real backend (no mock route), so these tests
// assert the request each method sends against a stubbed transport.
let stub: ReturnType<typeof stubApi>
afterEach(() => stub?.restore())

const page = { items: [{ id: 'drn-01', status: 'AVAILABLE' }], totalItems: 1 }

describe('dronesApi.listDrones', () => {
  it('GETs /api/drones and returns the page', async () => {
    stub = stubApi([{ path: '/api/drones', respond: page }])
    const result = await dronesApi.listDrones()
    expect(result.items).toHaveLength(1)
    expect(result.totalItems).toBe(1)
    expect(stub.calls[0]).toMatchObject({ method: 'GET', path: '/api/drones' })
  })

  it('sends the status filter as a query param', async () => {
    stub = stubApi([{ path: '/api/drones', respond: page }])
    await dronesApi.listDrones({ status: 'AVAILABLE', page: 2, pageSize: 5 })
    const q = stub.calls[0].query
    expect(q.get('status')).toBe('AVAILABLE')
    expect(q.get('page')).toBe('2')
    expect(q.get('pageSize')).toBe('5')
  })
})

describe('dronesApi.updateDrone', () => {
  const body = {
    serialNumber: 'SN001',
    droneModelId: 'model1',
    dronePayloadId: 'payload1',
    status: 'MAINTENANCE' as const,
  }

  it('PUTs the update body to /api/drones/{id}', async () => {
    stub = stubApi([
      {
        method: 'PUT',
        path: '/api/drones/:id',
        respond: ({ params, body: b }) => ({ id: params.id, ...(b as object) }),
      },
    ])
    const result = await dronesApi.updateDrone('drn-01', body)
    expect(result.status).toBe('MAINTENANCE')
    expect(stub.calls[0]).toMatchObject({
      method: 'PUT',
      path: '/api/drones/drn-01',
      body,
    })
  })

  it('throws when the backend rejects an unknown drone', async () => {
    stub = stubApi([
      {
        method: 'PUT',
        path: '/api/drones/:id',
        respond: stubError(404, 'NOT_FOUND', 'Drone not found'),
      },
    ])
    await expect(dronesApi.updateDrone('nonexistent', body)).rejects.toThrow()
  })
})
