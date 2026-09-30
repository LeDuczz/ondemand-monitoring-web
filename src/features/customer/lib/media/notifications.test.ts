import { describe, expect, it } from 'vitest'

import { MEDIA_AVAILABLE_EVENT, sortNotifications } from './notifications'

const n = (id: string, createdAt: string | null) => ({
  id,
  mediaId: `m-${id}`,
  missionId: 'ms',
  eventType: MEDIA_AVAILABLE_EVENT,
  createdAt,
})

describe('sortNotifications', () => {
  it('orders newest first and puts undated entries last', () => {
    const sorted = sortNotifications([
      n('old', '2026-09-01T00:00:00Z'),
      n('none', null),
      n('new', '2026-09-20T00:00:00Z'),
    ])
    expect(sorted.map((x) => x.id)).toEqual(['new', 'old', 'none'])
  })

  it('does not mutate its input', () => {
    const input = [n('a', '2026-09-01T00:00:00Z'), n('b', '2026-09-02T00:00:00Z')]
    sortNotifications(input)
    expect(input[0].id).toBe('a')
  })
})
