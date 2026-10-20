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

describe('maintenanceApi.listTickets backend filter contract', () => {
  it('uses backend filter names and applies unsupported severity filtering locally', async () => {
    stub = stubApi([
      {
        path: '/api/maintenance-tickets',
        respond: [
          rawTicket({ id: 'high-ticket', ticketCode: 'TKT-HIGH', deviceId: 'device-1', severity: 'HIGH' }),
          rawTicket({ id: 'low-ticket', ticketCode: 'TKT-LOW', deviceId: 'device-1', severity: 'LOW' }),
        ],
      },
    ])

    const result = await maintenanceApi.listTickets({
      droneId: 'device-1',
      priority: 'HIGH',
    })
    const query = stub.calls[0].query

    expect(query.get('deviceId')).toBe('device-1')
    expect(query.has('droneId')).toBe(false)
    expect(query.has('priority')).toBe(false)
    expect(result.items.map((ticket) => ticket.id)).toEqual(['high-ticket'])
  })
})

describe('maintenanceApi maintenance workflow contract', () => {
  it('assigns through the backend route and sends staffId', async () => {
    stub = stubApi([
      {
        method: 'PATCH',
        path: '/api/maintenance-tickets/:id/assign-staff',
        respond: rawTicket({
          id: 'ticket-1',
          ticketCode: 'TKT-1',
          deviceCode: 'DRN-1',
          assignedStaffId: 'staff-1',
          assignedStaffName: 'Operator One',
          status: 'IN_PROGRESS',
        }),
      },
    ])

    const result = await maintenanceApi.assignTechnician('ticket-1', 'staff-1')

    expect(stub.calls[0]).toMatchObject({
      method: 'PATCH',
      path: '/api/maintenance-tickets/ticket-1/assign-staff',
      body: { staffId: 'staff-1' },
    })
    expect(result.status).toBe('IN_PROGRESS')
    expect(result.assignedTo).toBe('Operator One')
  })

  it('resolves through the backend route with newDeviceStatus and maps its response', async () => {
    stub = stubApi([
      {
        method: 'PATCH',
        path: '/api/maintenance-tickets/:id/resolve',
        respond: rawTicket({
          id: 'ticket-1',
          ticketCode: 'TKT-1',
          deviceCode: 'DRN-1',
          status: 'RESOLVED',
          resolutionNotes: 'Repaired',
          resolvedAt: '2026-10-16T01:00:00Z',
        }),
      },
    ])

    const result = await maintenanceApi.resolveTicket('ticket-1', 'Repaired', 'AVAILABLE')

    expect(stub.calls[0]).toMatchObject({
      method: 'PATCH',
      path: '/api/maintenance-tickets/ticket-1/resolve',
      body: { resolutionNotes: 'Repaired', newDeviceStatus: 'AVAILABLE' },
    })
    expect(result.status).toBe('RESOLVED')
    expect(result.resolutionNotes).toBe('Repaired')
  })
})
