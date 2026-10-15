import type { AvailabilityStatus } from '../../lib/availabilitySlots'

// Fixed to the design's reference week (21/09 - 27/09/2026, Tuần 39). A real
// implementation would derive this from the demo clock plus ‹ › navigation;
// out of scope for the mock.
export const WEEK_KEY = '2026-W39'
export const WEEK_DAYS = [
  '2026-09-21',
  '2026-09-22',
  '2026-09-23',
  '2026-09-24',
  '2026-09-25',
  '2026-09-26',
  '2026-09-27',
]

// Structural (day/time/tone) part of the demo mission overlays; the label
// text comes from `availabilityPageMessages` so it can be bilingual.
export const OVERLAY_SHAPE: {
  day: string
  time: string
  tone: 'green' | 'gray'
}[] = [
  { day: '2026-09-21', time: '16:00', tone: 'green' },
  { day: '2026-09-24', time: '13:00', tone: 'gray' },
  { day: '2026-09-25', time: '08:00', tone: 'gray' },
]

export function applySelectionPreview(
  slots: Record<string, AvailabilityStatus>,
  selected: Set<string>,
  mode: AvailabilityStatus,
): Record<string, AvailabilityStatus> {
  if (selected.size === 0) return slots
  const next = { ...slots }
  for (const key of selected) next[key] = mode
  return next
}
