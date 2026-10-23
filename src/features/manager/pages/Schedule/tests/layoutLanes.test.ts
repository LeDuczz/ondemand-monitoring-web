import { describe, expect, it } from 'vitest'

import { layoutLanes } from '../scheduleHelpers'

const entry = (item: string, start: number, end: number) => ({ item, start, end })

describe('layoutLanes', () => {
  it('keeps non-overlapping missions in a single lane', () => {
    const result = layoutLanes([entry('a', 8, 9), entry('b', 10, 11)])
    expect(result.map((r) => [r.item, r.lane, r.lanes])).toEqual([
      ['a', 0, 1],
      ['b', 0, 1],
    ])
  })

  it('puts overlapping missions side by side', () => {
    const result = layoutLanes([entry('a', 8, 10), entry('b', 9, 11), entry('c', 9.5, 10.5)])
    expect(result.map((r) => [r.item, r.lane, r.lanes])).toEqual([
      ['a', 0, 3],
      ['b', 1, 3],
      ['c', 2, 3],
    ])
  })

  it('reuses a free lane and shares the lane count inside a cluster only', () => {
    const result = layoutLanes([entry('a', 8, 9), entry('b', 8.5, 10), entry('c', 9, 9.5), entry('d', 12, 13)])
    const byItem = Object.fromEntries(result.map((r) => [r.item, [r.lane, r.lanes]]))
    expect(byItem).toEqual({ a: [0, 2], b: [1, 2], c: [0, 2], d: [0, 1] })
  })
})
