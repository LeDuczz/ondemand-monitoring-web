import { describe, expect, it } from 'vitest'

import type { OrderStatus } from '../../../../shared/types/domain'
import { buildOrderSteps } from './orderSteps'
import type { OrderTimelineEvent } from './types'

const created: OrderTimelineEvent = { kind: 'created', at: '2026-09-28T01:00:00Z', actor: null, note: null }
const approved: OrderTimelineEvent = { kind: 'approved', at: '2026-09-29T01:00:00Z', actor: 'Staff', note: null }
const rejected: OrderTimelineEvent = { kind: 'rejected', at: '2026-09-29T02:00:00Z', actor: 'Staff', note: 'Vùng cấm' }
const status = (s: OrderStatus, at: string): OrderTimelineEvent => ({ kind: 'status', status: s, at, actor: null, note: null })

const states = (steps: ReturnType<typeof buildOrderSteps>) => steps.map((s) => `${s.key}:${s.state}`)

describe('buildOrderSteps', () => {
  it('PENDING: submitted done, approval current, rest upcoming', () => {
    expect(states(buildOrderSteps('PENDING', [created]))).toEqual([
      'submitted:done',
      'approved:current',
      'inProgress:upcoming',
      'completed:upcoming',
    ])
  })

  it('APPROVED: approved done, in progress current', () => {
    expect(states(buildOrderSteps('APPROVED', [created, approved]))).toEqual([
      'submitted:done',
      'approved:done',
      'inProgress:current',
      'completed:upcoming',
    ])
  })

  it('IN_PROGRESS: in progress is current and takes its date from the status event', () => {
    const steps = buildOrderSteps('IN_PROGRESS', [created, approved, status('IN_PROGRESS', '2026-09-30T01:00:00Z')])
    expect(states(steps)).toEqual(['submitted:done', 'approved:done', 'inProgress:current', 'completed:upcoming'])
    expect(steps[2].at).toBe('2026-09-30T01:00:00Z')
  })

  it('COMPLETED: all done, and a step without an event gets no date', () => {
    const steps = buildOrderSteps('COMPLETED', [created, approved, status('COMPLETED', '2026-10-01T01:00:00Z')])
    expect(states(steps)).toEqual(['submitted:done', 'approved:done', 'inProgress:done', 'completed:done'])
    expect(steps[2].at).toBeNull()
    expect(steps[3].at).toBe('2026-10-01T01:00:00Z')
  })

  it('REJECTED: submitted done then a failed terminal step with the review info, nothing upcoming', () => {
    const steps = buildOrderSteps('REJECTED', [created, rejected])
    expect(states(steps)).toEqual(['submitted:done', 'rejected:failed'])
    expect(steps[1]).toMatchObject({ at: rejected.at, actor: 'Staff', note: 'Vùng cấm' })
  })

  it('CANCELLED without an approval event shows only what the events prove', () => {
    const steps = buildOrderSteps('CANCELLED', [created, status('CANCELLED', '2026-09-30T01:00:00Z')])
    expect(states(steps)).toEqual(['submitted:done', 'cancelled:cancelled'])
    expect(steps[1].at).toBe('2026-09-30T01:00:00Z')
  })

  it('CANCELLED after an approval event keeps the approved step', () => {
    const steps = buildOrderSteps('CANCELLED', [created, approved, status('CANCELLED', '2026-09-30T01:00:00Z')])
    expect(states(steps)).toEqual(['submitted:done', 'approved:done', 'cancelled:cancelled'])
  })

  it('never invents dates when there are no events', () => {
    for (const s of ['PENDING', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'] as OrderStatus[]) {
      expect(buildOrderSteps(s, []).every((x) => x.at === null && x.actor === null && x.note === null)).toBe(true)
    }
  })

  it('has no steps for draft-like statuses', () => {
    expect(buildOrderSteps('DRAFT', [])).toEqual([])
  })
})
