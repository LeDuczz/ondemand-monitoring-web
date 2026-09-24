import { describe, expect, it } from 'vitest'

import type { OrderCreateResponse } from '../types/orders'
import { formatWaitLabel, isOverdue, sortQueue } from './queue'

const now = new Date('2026-09-19T14:32:00+07:00')

function row(partial: Partial<OrderCreateResponse>): OrderCreateResponse {
  return {
    id: 'ord-1',
    customerId: 'cust-1',
    customerName: 'A',
    title: 'Title',
    serviceId: 'svc-1',
    serviceName: 'Service',
    description: '',
    address: '',
    longitude: 0,
    latitude: 0,
    coverageArea: null,
    preferredDateFrom: '2026-09-25T00:00:00+07:00',
    preferredDateTo: '2026-09-25T00:00:00+07:00',
    preferredTimeId: 'time-1',
    preferredTimeName: 'Chiều',
    orderStatus: 'PENDING',
    rejectReason: null,
    reviewById: null,
    reviewByName: null,
    reviewAt: null,
    deliverables: [],
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    ...partial,
  }
}

describe('sortQueue', () => {
  it('longestWait: sorts purely by wait time, longest first', () => {
    const a = row({
      id: 'a',
      createdAt: new Date(now.getTime() - 3 * 3600_000).toISOString(),
    })
    const b = row({
      id: 'b',
      createdAt: new Date(now.getTime() - 12 * 3600_000).toISOString(),
    })
    expect(sortQueue([a, b], 'longestWait', now).map((r) => r.id)).toEqual([
      'b',
      'a',
    ])
  })

  it('preferredDateAsc: earliest preferredDateFrom first', () => {
    const a = row({ id: 'a', preferredDateFrom: '2026-09-27T00:00:00+07:00' })
    const b = row({ id: 'b', preferredDateFrom: '2026-09-21T00:00:00+07:00' })
    expect(sortQueue([a, b], 'preferredDateAsc', now).map((r) => r.id)).toEqual(
      ['b', 'a'],
    )
  })
})

describe('isOverdue / formatWaitLabel', () => {
  it('flags >=24h as overdue and formats the label', () => {
    const overdue = row({
      createdAt: new Date(now.getTime() - 31 * 3600_000).toISOString(),
    })
    const fresh = row({
      createdAt: new Date(now.getTime() - 6 * 3600_000).toISOString(),
    })
    expect(isOverdue(now, overdue)).toBe(true)
    expect(isOverdue(now, fresh)).toBe(false)
    expect(formatWaitLabel(now, overdue)).toBe('31 giờ · quá 24h')
    expect(formatWaitLabel(now, fresh)).toBe('6 giờ')
  })

  it('is not overdue at exactly 23h59', () => {
    const almost = row({
      createdAt: new Date(
        now.getTime() - (23 * 3600_000 + 59 * 60_000),
      ).toISOString(),
    })
    expect(isOverdue(now, almost)).toBe(false)
  })
})
