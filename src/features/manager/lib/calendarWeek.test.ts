import { describe, expect, it } from 'vitest'

import { formatCalendarWeek, nextWeek, prevWeek, toISODate } from './calendarWeek'

describe('formatCalendarWeek', () => {
  it('returns Mon–Sun for a Wednesday input', () => {
    // 2026-09-23 is a Wednesday; week should be 21–27 Sep (as in MNG-06 design)
    const { weekStart, weekEnd, days } = formatCalendarWeek(
      new Date('2026-09-23T12:00:00'),
    )
    expect(toISODate(weekStart)).toBe('2026-09-21')
    expect(toISODate(weekEnd)).toBe('2026-09-27')
    expect(days).toHaveLength(7)
    expect(toISODate(days[0])).toBe('2026-09-21') // Monday
    expect(toISODate(days[6])).toBe('2026-09-27') // Sunday
  })

  it('returns same week when given the Monday of the week', () => {
    const { weekStart } = formatCalendarWeek(new Date('2026-09-21T00:00:00'))
    expect(toISODate(weekStart)).toBe('2026-09-21')
  })

  it('returns same week when given the Sunday of the week', () => {
    const { weekEnd } = formatCalendarWeek(new Date('2026-09-27T23:59:59'))
    expect(toISODate(weekEnd)).toBe('2026-09-27')
  })

  it('handles a Monday input (boundary)', () => {
    const { weekStart, weekEnd } = formatCalendarWeek(
      new Date('2026-09-21T00:00:00'),
    )
    expect(toISODate(weekStart)).toBe('2026-09-21')
    expect(toISODate(weekEnd)).toBe('2026-09-27')
  })

  it('handles a Sunday input (boundary)', () => {
    // 2026-09-27 is Sunday
    const { weekStart, weekEnd } = formatCalendarWeek(
      new Date('2026-09-27T00:00:00'),
    )
    expect(toISODate(weekStart)).toBe('2026-09-21')
    expect(toISODate(weekEnd)).toBe('2026-09-27')
  })

  it('days array has 7 elements in Mon–Sun order', () => {
    const { days } = formatCalendarWeek(new Date('2026-09-24T00:00:00'))
    expect(days).toHaveLength(7)
    for (let i = 0; i < 6; i++) {
      const diffMs = days[i + 1].getTime() - days[i].getTime()
      expect(diffMs).toBe(24 * 60 * 60 * 1000)
    }
  })

  it('does not mutate the input date', () => {
    const input = new Date('2026-09-24T12:30:00')
    const original = input.getTime()
    formatCalendarWeek(input)
    expect(input.getTime()).toBe(original)
  })

  it('handles year-boundary week (Mon 28 Dec – Sun 3 Jan)', () => {
    // 2026-12-28 Monday → week 28 Dec – 3 Jan 2027
    const { weekStart, weekEnd, days } = formatCalendarWeek(
      new Date('2026-12-30T00:00:00'),
    )
    expect(toISODate(weekStart)).toBe('2026-12-28')
    expect(toISODate(weekEnd)).toBe('2027-01-03')
    expect(days).toHaveLength(7)
  })
})

describe('nextWeek / prevWeek', () => {
  it('nextWeek advances by 7 days', () => {
    const d = new Date('2026-09-21')
    const n = nextWeek(d)
    expect(toISODate(formatCalendarWeek(n).weekStart)).toBe('2026-09-28')
  })

  it('prevWeek goes back 7 days', () => {
    const d = new Date('2026-09-21')
    const p = prevWeek(d)
    expect(toISODate(formatCalendarWeek(p).weekStart)).toBe('2026-09-14')
  })
})
