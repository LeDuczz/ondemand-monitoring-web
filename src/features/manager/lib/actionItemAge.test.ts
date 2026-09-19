import { describe, expect, it } from 'vitest'

import {
  formatFlightMinutes,
  formatFlightProgress,
  formatMinutesAgo,
  formatMissionCountdown,
  formatOrderAge,
  formatTicketAge,
} from './actionItemAge'

// "now" matches the design's dashboard snapshot [TK MNG-01]:
// Thứ Bảy, 19/09/2026 · 14:32 (+07:00)
const NOW = new Date('2026-09-19T14:32:00+07:00')

describe('formatOrderAge', () => {
  it('flags overdue orders past 24h, matching the design (31 giờ · quá 24h)', () => {
    expect(formatOrderAge(NOW, '2026-09-18T07:32:00+07:00')).toBe(
      '31 giờ · quá 24h',
    )
  })

  it('flags a second overdue order (26 giờ · quá 24h)', () => {
    expect(formatOrderAge(NOW, '2026-09-18T12:32:00+07:00')).toBe(
      '26 giờ · quá 24h',
    )
  })

  it('does not add the overdue suffix under the threshold', () => {
    expect(formatOrderAge(NOW, '2026-09-19T09:32:00+07:00')).toBe('5 giờ')
  })
})

describe('formatMissionCountdown', () => {
  it('matches the design sample (Còn 2 giờ 28 phút)', () => {
    expect(formatMissionCountdown(NOW, '2026-09-19T17:00:00+07:00')).toBe(
      'Còn 2 giờ 28 phút',
    )
  })

  it('omits the hour part under 60 minutes', () => {
    expect(formatMissionCountdown(NOW, '2026-09-19T15:02:00+07:00')).toBe(
      'Còn 30 phút',
    )
  })

  it('reports "Trễ" once the scheduled time has passed', () => {
    expect(formatMissionCountdown(NOW, '2026-09-19T14:02:00+07:00')).toBe(
      'Trễ 30 phút',
    )
  })
})

describe('formatTicketAge', () => {
  it('matches the design sample (Mở 6 ngày)', () => {
    expect(formatTicketAge(NOW, '2026-09-13T14:32:00+07:00')).toBe('Mở 6 ngày')
  })
})

describe('formatMinutesAgo', () => {
  it('matches the design sample (42 phút trước)', () => {
    expect(formatMinutesAgo(NOW, '2026-09-19T13:50:00+07:00')).toBe(
      '42 phút trước',
    )
  })
})

describe('formatFlightMinutes', () => {
  it('matches the design sample (Bay 58 phút)', () => {
    expect(formatFlightMinutes(NOW, '2026-09-19T13:34:00+07:00')).toBe(
      'Bay 58 phút',
    )
  })
})

describe('formatFlightProgress', () => {
  it('matches the design sample (00:58 / 90:00)', () => {
    expect(formatFlightProgress(NOW, '2026-09-19T13:34:00+07:00', 90)).toBe(
      '00:58 / 90:00',
    )
  })

  it('never goes negative when started slightly in the future (clock skew)', () => {
    expect(formatFlightProgress(NOW, '2026-09-19T14:33:00+07:00', 90)).toBe(
      '00:00 / 90:00',
    )
  })
})
