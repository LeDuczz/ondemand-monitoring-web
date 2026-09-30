import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { resetMockDb } from '../../../mocks/db'
import '../../../mocks/index'
import { maintenanceApi } from './maintenanceApi'

beforeEach(() => resetMockDb())
afterEach(() => resetMockDb())

describe('maintenanceApi.listTickets', () => {
  it('returns a list of tickets', async () => {
    const result = await maintenanceApi.listTickets()
    expect(result.items.length).toBeGreaterThan(0)
  })

  it('filters by status', async () => {
    const result = await maintenanceApi.listTickets({ status: 'OPEN' })
    for (const t of result.items) {
      expect(t.status).toBe('OPEN')
    }
  })
})

describe('maintenanceApi.createTicket', () => {
  it('creates a ticket', async () => {
    const result = await maintenanceApi.createTicket({
      droneId: 'drn-01',
      title: 'Test ticket',
      priority: 'HIGH',
    })
    expect(result.status).toBe('OPEN')
    expect(result.title).toBe('Test ticket')
  })

  it('throws when title is missing', async () => {
    await expect(
      maintenanceApi.createTicket({ droneId: 'drn-01', title: '' }),
    ).rejects.toThrow()
  })
})

describe('maintenanceApi.patchTicketStatus', () => {
  it('transitions OPEN → IN_PROGRESS', async () => {
    const result = await maintenanceApi.patchTicketStatus(
      'mt-2609-011',
      'IN_PROGRESS',
    )
    expect(result.status).toBe('IN_PROGRESS')
  })

  it('throws on invalid transition', async () => {
    await expect(
      maintenanceApi.patchTicketStatus('mt-2609-008', 'OPEN'),
    ).rejects.toThrow()
  })
})
