import type { CSSProperties } from 'react'

import type { MissionCalendarItem } from '../../../types/missions'
import { toLocalHours, HOUR_START } from '../scheduleHelpers'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { toUiTone } from '../../../../../shared/components/ui'

// ── MissionBlock ───────────────────────────────────────────────────────────

export type MissionBlockProps = {
  mission: MissionCalendarItem
  /** Lane inside an overlapping cluster, 0-based. */
  lane: number
  /** Number of lanes in the cluster, so overlapping missions sit side by side. */
  lanes: number
  selected: boolean
  onSelect: (m: MissionCalendarItem) => void
  missionStatusLabel: string
}

export function MissionBlock({
  mission,
  lane,
  lanes,
  selected,
  onSelect,
  missionStatusLabel,
}: MissionBlockProps) {
  const startH = mission.scheduledStartAt
    ? toLocalHours(mission.scheduledStartAt)
    : HOUR_START
  const endH = mission.scheduledEndAt
    ? toLocalHours(mission.scheduledEndAt)
    : startH

  const tone = toUiTone(missionStatusTone[mission.status] ?? 'gray')
  // Geometry is data-driven, so it is handed to the stylesheet as custom properties.
  const geometry = {
    '--start': Math.max(0, startH - HOUR_START),
    '--span': Math.max(0.3, endH - startH),
    '--lane': lane,
    '--lanes': lanes,
  } as CSSProperties

  return (
    <button
      type="button"
      className={`mgr-sched-block is-${tone}${selected ? ' is-selected' : ''}`}
      style={geometry}
      onClick={() => onSelect(mission)}
      aria-pressed={selected}
      aria-label={`${mission.missionCode} ${missionStatusLabel}`}
    >
      <span className="mgr-sched-block-code">
        {mission.missionCode.slice(-6)}
      </span>
      {mission.droneCode && (
        <span className="mgr-sched-block-meta">
          {mission.droneCode}
          {mission.operatorName
            ? ` · ${mission.operatorName.split(' ').at(-1)}`
            : ''}
        </span>
      )}
    </button>
  )
}
