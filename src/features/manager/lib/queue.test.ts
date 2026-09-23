import { describe, expect, it } from 'vitest'

import type { OrderQueueItem } from '../types/orders'
import { countByVerdict, formatWaitLabel, isOverdue, sortQueue } from './queue'

const now = new Date('2026-09-19T14:32:00+07:00')

function row(partial: Partial<OrderQueueItem>): OrderQueueItem {
  return {
    id: 'ord-1',
    code: 'ORD-1',
    customer: { fullName: 'A', companyName: 'B' },
    serviceName: 'Service',
    preferredDate: '25/09',
    preferredTimeName: 'Chiều',
    submittedAt: now.toISOString(),
    aiVerdict: 'FEASIBLE',
    blockerCount: 0,
    warningCount: 0,
    ...partial,
  }
}

describe('sortQueue', () => {
  it('feasibleFirst: FEASIBLE rows before RISKY, longest wait first within a group', () => {
    const risky = row({
      id: 'risky',
      aiVerdict: 'RISKY',
      submittedAt: new Date(now.getTime() - 19 * 3600_000).toISOString(),
    })
    const feasibleShort = row({
      id: 'feasible-short',
      aiVerdict: 'FEASIBLE',
      submittedAt: new Date(now.getTime() - 6 * 3600_000).toISOString(),
    })
    const feasibleLong = row({
      id: 'feasible-long',
      aiVerdict: 'FEASIBLE',
      submittedAt: new Date(now.getTime() - 31 * 3600_000).toISOString(),
    })
    const sorted = sortQueue(
      [risky, feasibleShort, feasibleLong],
      'feasibleFirst',
      now,
    )
    expect(sorted.map((r) => r.id)).toEqual([
      'feasible-long',
      'feasible-short',
      'risky',
    ])
  })

  it('longestWait: ignores verdict, purely by wait time', () => {
    const a = row({
      id: 'a',
      submittedAt: new Date(now.getTime() - 3 * 3600_000).toISOString(),
    })
    const b = row({
      id: 'b',
      aiVerdict: 'RISKY',
      submittedAt: new Date(now.getTime() - 12 * 3600_000).toISOString(),
    })
    expect(sortQueue([a, b], 'longestWait', now).map((r) => r.id)).toEqual([
      'b',
      'a',
    ])
  })

  it('preferredDateAsc: earliest dd/MM first', () => {
    const a = row({ id: 'a', preferredDate: '27/09' })
    const b = row({ id: 'b', preferredDate: '21/09' })
    expect(sortQueue([a, b], 'preferredDateAsc', now).map((r) => r.id)).toEqual(
      ['b', 'a'],
    )
  })
})

describe('countByVerdict', () => {
  it('counts each verdict plus all', () => {
    const rows = [
      row({ aiVerdict: 'FEASIBLE' }),
      row({ aiVerdict: 'FEASIBLE' }),
      row({ aiVerdict: 'RISKY' }),
    ]
    expect(countByVerdict(rows)).toEqual({
      all: 3,
      FEASIBLE: 2,
      RISKY: 1,
      INFEASIBLE: 0,
    })
  })
})

describe('isOverdue / formatWaitLabel', () => {
  it('flags >=24h as overdue and formats the label', () => {
    const overdue = row({
      submittedAt: new Date(now.getTime() - 31 * 3600_000).toISOString(),
    })
    const fresh = row({
      submittedAt: new Date(now.getTime() - 6 * 3600_000).toISOString(),
    })
    expect(isOverdue(now, overdue)).toBe(true)
    expect(isOverdue(now, fresh)).toBe(false)
    expect(formatWaitLabel(now, overdue)).toBe('31 giờ · quá 24h')
    expect(formatWaitLabel(now, fresh)).toBe('6 giờ')
  })

  it('is not overdue at exactly 23h59', () => {
    const almost = row({
      submittedAt: new Date(
        now.getTime() - (23 * 3600_000 + 59 * 60_000),
      ).toISOString(),
    })
    expect(isOverdue(now, almost)).toBe(false)
  })
})
