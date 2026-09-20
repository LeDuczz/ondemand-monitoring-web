import { describe, expect, it } from 'vitest'

import { mergeSlots, rangeSelect, slotKey, slotTimes } from './availabilitySlots'

describe('slotTimes', () => {
  it('starts at 06:00 and ends before 19:00 in 30-minute steps', () => {
    const times = slotTimes()
    expect(times[0]).toBe('06:00')
    expect(times[times.length - 1]).toBe('18:30')
    expect(times).toHaveLength(26)
  })
})

describe('mergeSlots', () => {
  it('sets status for the given keys without touching others', () => {
    const base = { [slotKey('2026-09-21', '07:00')]: 'BUSY' as const }
    const next = mergeSlots(base, [slotKey('2026-09-21', '08:00')], 'AVAILABLE')
    expect(next[slotKey('2026-09-21', '07:00')]).toBe('BUSY')
    expect(next[slotKey('2026-09-21', '08:00')]).toBe('AVAILABLE')
  })

  it('overwrites an existing key', () => {
    const base = { [slotKey('2026-09-21', '07:00')]: 'BUSY' as const }
    const next = mergeSlots(base, [slotKey('2026-09-21', '07:00')], 'OFF')
    expect(next[slotKey('2026-09-21', '07:00')]).toBe('OFF')
  })
})

describe('rangeSelect', () => {
  const days = ['2026-09-21', '2026-09-22', '2026-09-23']
  const times = ['07:00', '07:30', '08:00']

  it('selects a single cell when anchor equals current', () => {
    const keys = rangeSelect(days, times, { day: days[0], time: times[0] }, { day: days[0], time: times[0] })
    expect(keys).toEqual([slotKey(days[0], times[0])])
  })

  it('selects a rectangle spanning days and times regardless of drag direction', () => {
    const forward = rangeSelect(days, times, { day: days[0], time: times[0] }, { day: days[1], time: times[1] })
    const backward = rangeSelect(days, times, { day: days[1], time: times[1] }, { day: days[0], time: times[0] })
    const expected = [
      slotKey(days[0], times[0]),
      slotKey(days[0], times[1]),
      slotKey(days[1], times[0]),
      slotKey(days[1], times[1]),
    ]
    expect(forward.sort()).toEqual(expected.sort())
    expect(backward.sort()).toEqual(expected.sort())
  })

  it('returns an empty array for an unknown day or time', () => {
    expect(rangeSelect(days, times, { day: 'nope', time: times[0] }, { day: days[0], time: times[0] })).toEqual([])
  })
})
