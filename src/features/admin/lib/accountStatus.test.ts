import { describe, expect, it } from 'vitest'

import { fmtDate, fmtDateTime, getAccountStatusMeta } from './accountStatus'

describe('getAccountStatusMeta', () => {
  it('returns vi by default and en when asked', () => {
    expect(getAccountStatusMeta('ACTIVE')).toEqual({
      label: 'Hoạt động',
      tone: 'green',
    })
    expect(getAccountStatusMeta('ACTIVE', 'en')).toEqual({
      label: 'Active',
      tone: 'green',
    })
  })
})

describe('date formatters', () => {
  it('formats dates per language', () => {
    expect(fmtDate('2026-03-05T00:00:00Z', 'en')).toMatch(/2026/)
    expect(fmtDateTime('2026-03-05T10:00:00Z', 'vi')).toMatch(/2026/)
  })
})
