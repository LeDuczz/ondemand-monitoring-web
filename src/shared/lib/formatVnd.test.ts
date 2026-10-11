import { describe, expect, it } from 'vitest'

import { formatVnd } from './formatVnd'

describe('formatVnd', () => {
  it('formats whole VND amounts with Vietnamese grouping', () => {
    expect(formatVnd(8_500_000)).toContain('8.500.000')
  })

  it('falls back to zero for an invalid amount', () => {
    expect(formatVnd('not-a-number')).toContain('0')
  })
})
