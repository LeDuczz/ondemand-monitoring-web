import { describe, expect, it } from 'vitest'

import { hasScheduleConflict } from './schedule'

// [BRIEF/TK MNG-05 "Xung đột lịch"] DRN-04 overlaps MSN-2609-0150-1 07:30–09:00
// against a new mission window 08:00–09:30 on 24/09/2026.
const existing = [
  {
    missionCode: 'MSN-2609-0150-1',
    start: '2026-09-24T07:30:00+07:00',
    end: '2026-09-24T09:00:00+07:00',
  },
]

describe('hasScheduleConflict', () => {
  it('finds the design-sourced overlap (08:00–09:30 vs 07:30–09:00)', () => {
    const conflict = hasScheduleConflict(
      { start: '2026-09-24T08:00:00+07:00', end: '2026-09-24T09:30:00+07:00' },
      existing,
    )
    expect(conflict?.missionCode).toBe('MSN-2609-0150-1')
  })

  it('returns undefined when the windows do not overlap', () => {
    const conflict = hasScheduleConflict(
      { start: '2026-09-24T09:00:00+07:00', end: '2026-09-24T10:00:00+07:00' },
      existing,
    )
    expect(conflict).toBeUndefined()
  })

  it('treats back-to-back windows (end === start) as non-overlapping', () => {
    const conflict = hasScheduleConflict(
      { start: '2026-09-24T09:00:00+07:00', end: '2026-09-24T09:30:00+07:00' },
      [
        {
          missionCode: 'MSN-X',
          start: '2026-09-24T08:00:00+07:00',
          end: '2026-09-24T09:00:00+07:00',
        },
      ],
    )
    expect(conflict).toBeUndefined()
  })

  it('returns undefined for an empty bookings list', () => {
    expect(
      hasScheduleConflict(
        {
          start: '2026-09-24T08:00:00+07:00',
          end: '2026-09-24T09:30:00+07:00',
        },
        [],
      ),
    ).toBeUndefined()
  })

  it('detects a window fully contained inside an existing booking', () => {
    const conflict = hasScheduleConflict(
      { start: '2026-09-24T08:00:00+07:00', end: '2026-09-24T08:30:00+07:00' },
      existing,
    )
    expect(conflict?.missionCode).toBe('MSN-2609-0150-1')
  })
})
