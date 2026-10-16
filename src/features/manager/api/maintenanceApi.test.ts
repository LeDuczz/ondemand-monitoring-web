import { afterEach, describe, expect, it } from 'vitest'

import { stubApi, stubError } from '../../../test/stubApi'
import { maintenanceApi } from './maintenanceApi'

// /api/maintenance-tickets is served by the real backend (no mock route), so
// these tests assert the request each method sends against a stubbed transport.
let stub: ReturnType<typeof stubApi>
afterEach(() => stub?.restore())

const rawTicket = (over: Record<string, unknown> = {}) => ({
  id: 'mt-1',
  ticketCode: 'MT-1',
  title: 'Test ticket',
  deviceId: 'drn-01',
  severity: 'HIGH',
  status: 'OPEN',
  openedAt: '2026-09-01T00:00:00Z',
  ...over,
})

describe('maintenanceApi.listTickets', () => {
  it('maps the backend list into tickets', async () => {
    stub = stubApi([
      { path: '/api/maintenance-tickets', respond: [rawTicket()] },
    ])
    const result = await maintenanceApi.listTickets()
    expect(result.items).toHaveLength(1)
    expect(result.items[0]).toMatchObject({ code: 'MT-1', priority: 'HIGH' })
  })

  it('sends the status filter as a query param', async () => {
    stub = stubApi([{ path: '/api/maintenance-tickets', respond: [] }])
    await maintenanceApi.listTickets({ status: 'OPEN' })
    expect(stub.calls[0].query.get('status')).toBe('OPEN')
  })
})

describe('maintenanceApi.createTicket', () => {
  it('POSTs the ticket body', async () => {
    stub = stubApi([
      {
        method: 'POST',
        path: '/api/maintenance-tickets',
        respond: ({ body }) => rawTicket({ title: (body as { title: string }).title }),
      },
    ])
    const input = { droneId: 'drn-01', title: 'Test ticket', priority: 'HIGH' as const }
    const result = await maintenanceApi.createTicket(input)
    expect(result.status).toBe('OPEN')
    expect(result.title).toBe('Test ticket')
    expect(stub.calls[0]).toMatchObject({ method: 'POST', body: input })
  })

  it('throws when the backend rejects the ticket', async () => {
    stub = stubApi([
      {
        method: 'POST',
        path: '/api/maintenance-tickets',
        respond: stubError(400, 'VALIDATION_ERROR'),
      },
    ])
    await expect(
      maintenanceApi.createTicket({ droneId: 'drn-01', title: '' }),
    ).rejects.toThrow()
  })
})

describe('maintenanceApi.patchTicketStatus', () => {
  it('PATCHes assign-staff with the new status', async () => {
    stub = stubApi([
      {
        method: 'PATCH',
        path: '/api/maintenance-tickets/:id/assign-staff',
        respond: ({ body }) => rawTicket({ status: (body as { status: string }).status }),
      },
    ])
    const result = await maintenanceApi.patchTicketStatus('mt-1', 'IN_PROGRESS')
    expect(result.status).toBe('IN_PROGRESS')
    expect(stub.calls[0]).toMatchObject({
      method: 'PATCH',
      path: '/api/maintenance-tickets/mt-1/assign-staff',
      body: { status: 'IN_PROGRESS' },
    })
  })

  it('routes RESOLVED through the resolve endpoint', async () => {
    stub = stubApi([
      {
        method: 'PATCH',
        path: '/api/maintenance-tickets/:id/resolve',
        respond: rawTicket({ status: 'RESOLVED' }),
      },
    ])
    const result = await maintenanceApi.patchTicketStatus('mt-1', 'RESOLVED')
    expect(result.status).toBe('RESOLVED')
    expect(stub.calls[0].path).toBe('/api/maintenance-tickets/mt-1/resolve')
  })
})
