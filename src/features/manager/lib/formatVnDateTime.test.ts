import { describe, expect, it } from 'vitest'

import { formatVnDateTime } from './formatVnDateTime'

describe('formatVnDateTime', () => {
  it('matches the design sample: Thứ Bảy, 19/09/2026 · 14:32', () => {
    expect(formatVnDateTime(new Date(2026, 8, 19, 14, 32))).toBe(
      'Thứ Bảy, 19/09/2026 · 14:32',
    )
  })

  it('pads single-digit day/month/hour/minute', () => {
    expect(formatVnDateTime(new Date(2026, 0, 5, 9, 3))).toBe(
      'Thứ Hai, 05/01/2026 · 09:03',
    )
  })

  it.each([
    [new Date(2026, 8, 13), 'Chủ Nhật'],
    [new Date(2026, 8, 14), 'Thứ Hai'],
    [new Date(2026, 8, 15), 'Thứ Ba'],
    [new Date(2026, 8, 16), 'Thứ Tư'],
    [new Date(2026, 8, 17), 'Thứ Năm'],
    [new Date(2026, 8, 18), 'Thứ Sáu'],
    [new Date(2026, 8, 19), 'Thứ Bảy'],
  ])('labels weekday for %s as %s', (date, expected) => {
    expect(formatVnDateTime(date).startsWith(expected)).toBe(true)
  })
})
