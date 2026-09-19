import { describe, expect, it } from 'vitest'

import { prefillWindow } from './prefillWindow'

describe('prefillWindow', () => {
  it('prefills Sáng to a 07:00 start + 90-minute default duration', () => {
    const result = prefillWindow('24/09', 'Sáng', 2026)
    expect(result).toEqual({
      scheduledStart: '2026-09-24T07:00',
      scheduledEnd: '2026-09-24T08:30',
    })
  })

  it('prefills Chiều to a 13:00 start', () => {
    const result = prefillWindow('25/09', 'Chiều', 2026)
    expect(result?.scheduledStart).toBe('2026-09-25T13:00')
  })

  it('returns null for an unrecognized time-window name', () => {
    expect(prefillWindow('24/09', 'Đêm khuya', 2026)).toBeNull()
  })

  it('returns null for a malformed date', () => {
    expect(prefillWindow('2026-09-24', 'Sáng', 2026)).toBeNull()
  })
})
