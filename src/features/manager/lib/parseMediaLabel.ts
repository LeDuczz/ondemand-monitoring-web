// PROPOSED: CreateMissionPage (MNG-04) only has the order's free-text
// `mediaRequirements[].label` (e.g. "VIDEO × 1 · 240 giây", "PHOTO × 30 ·
// 640×512") — `OrderMediaRequirement` never got a structured shape in P4.
// This parses the small set of label formats the seeded orders actually
// use into `estimatePlanDuration`'s structured `MediaRequirement`, so the
// duration preview can include T_video/T_photo. Labels that don't match a
// known pattern are skipped rather than guessed at.
import type { MediaRequirement } from './planDuration'

const VIDEO_RE = /VIDEO\s*×\s*(\d+)\s*·\s*(\d+)\s*giây/
const PHOTO_RE = /PHOTO\s*×\s*(\d+)/
const LIVESTREAM_RE = /LIVESTREAM\s*·\s*(\d+)\s*giây/

export function parseMediaLabel(label: string): MediaRequirement | null {
  const video = VIDEO_RE.exec(label)
  if (video) {
    const count = Number(video[1])
    const durationSec = Number(video[2])
    return { mediaType: 'VIDEO', durationSec: count * durationSec }
  }
  const photo = PHOTO_RE.exec(label)
  if (photo) {
    return { mediaType: 'PHOTO', quantity: Number(photo[1]) }
  }
  const stream = LIVESTREAM_RE.exec(label)
  if (stream) {
    return { mediaType: 'LIVESTREAM', durationSec: Number(stream[1]) }
  }
  return null
}

export function parseMediaLabels(labels: string[]): MediaRequirement[] {
  return labels
    .map(parseMediaLabel)
    .filter((r): r is MediaRequirement => r !== null)
}
