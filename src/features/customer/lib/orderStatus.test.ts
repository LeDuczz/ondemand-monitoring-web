import { describe, expect, it } from 'vitest'

import {
  fmtDate,
  fmtDateTime,
  getMissionStatusMeta,
  getOrderStatusMeta,
} from './orderStatus'

describe('getOrderStatusMeta', () => {
  it('returns the Vietnamese label and tone', () => {
    expect(getOrderStatusMeta('APPROVED', 'vi')).toEqual({
      label: 'Đã duyệt',
      tone: 'blue',
    })
  })

  it('returns the English label with the same tone', () => {
    expect(getOrderStatusMeta('APPROVED', 'en')).toEqual({
      label: 'Approved',
      tone: 'blue',
    })
  })
})

describe('getMissionStatusMeta', () => {
  it('returns the Vietnamese label and tone', () => {
    expect(getMissionStatusMeta('IN_FLIGHT', 'vi')).toEqual({
      label: 'Đang bay',
      tone: 'blue',
    })
  })

  it('returns the English label with the same tone', () => {
    expect(getMissionStatusMeta('IN_FLIGHT', 'en')).toEqual({
      label: 'In flight',
      tone: 'blue',
    })
  })
})

describe('fmtDate / fmtDateTime', () => {
  it('formats dates for vi-VN as dd/mm/yyyy', () => {
    expect(fmtDate('2026-03-05T00:00:00.000Z', 'vi-VN')).toMatch(
      /05\/03\/2026|04\/03\/2026/,
    )
  })

  it('formats using the given locale', () => {
    const vi = fmtDateTime('2026-03-05T10:00:00.000Z', 'vi-VN')
    const en = fmtDateTime('2026-03-05T10:00:00.000Z', 'en-US')
    expect(vi).not.toBe(en)
  })
})
