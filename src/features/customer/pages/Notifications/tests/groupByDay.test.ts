import { describe, expect, it } from 'vitest'

import type { MediaNotification } from '../../../lib/media/types'
import { daysAgo, groupByDay } from '../groupByDay'

const n = (id: string, createdAt: string | null): MediaNotification => ({
  id,
  mediaId: 'm',
  missionId: 'ms',
  eventType: 'CUSTOMER_MEDIA_AVAILABLE',
  createdAt,
})

describe('groupByDay', () => {
  it('groups consecutive entries of the same local day and keeps order', () => {
    const groups = groupByDay([
      n('a', new Date(2026, 9, 23, 10).toISOString()),
      n('b', new Date(2026, 9, 23, 8).toISOString()),
      n('c', new Date(2026, 9, 22, 23).toISOString()),
      n('d', null),
    ])
    expect(groups.map((g) => [g.key, g.items.map((i) => i.id)])).toEqual([
      ['2026-10-23', ['a', 'b']],
      ['2026-10-22', ['c']],
      ['unknown', ['d']],
    ])
  })

  it('counts calendar days between a date and now', () => {
    const now = new Date(2026, 9, 23, 0, 5)
    expect(daysAgo(new Date(2026, 9, 23, 23, 59), now)).toBe(0)
    expect(daysAgo(new Date(2026, 9, 22, 23, 59), now)).toBe(1)
    expect(daysAgo(new Date(2026, 8, 14), now)).toBe(39)
  })
})
