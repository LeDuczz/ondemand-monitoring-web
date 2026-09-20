import { describe, expect, it } from 'vitest'

import { demoNow } from './demoNow'

describe('demoNow', () => {
  it('returns the fixed 19/09/2026 14:32 (+07:00) demo clock', () => {
    const now = demoNow()
    // Compare via the UTC-equivalent instant so this test is timezone-safe.
    expect(now.toISOString()).toBe('2026-09-19T07:32:00.000Z')
  })

  it('is stable across calls', () => {
    expect(demoNow().getTime()).toBe(demoNow().getTime())
  })
})
