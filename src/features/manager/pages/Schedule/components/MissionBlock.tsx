import { toLocalHours, HOUR_START, PX_PER_HOUR } from '../scheduleHelpers'
import { toUiTone } from '../../../../../shared/components/ui'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import type { MissionCalendarItem } from '../../../types/missions'

type MissionBlockProps = {
  mission: MissionCalendarItem
  selected: boolean
  onSelect: (m: MissionCalendarItem) => void
  missionStatusLabel: string
  /** Overlap layout: lane index and lane count of this chip's cluster. */
  lane?: number
  lanes?: number
}

/** Rounded, status-coloured chip positioned on the time grid. */
export function MissionBlock({
  mission,
  selected,
  onSelect,
  missionStatusLabel,
  lane = 0,
  lanes = 1,
}: MissionBlockProps) {
  const startH = mission.scheduledStartAt
    ? toLocalHours(mission.scheduledStartAt)
    : HOUR_START
  const endH = mission.scheduledEndAt
    ? toLocalHours(mission.scheduledEndAt)
    : startH

  const top = Math.max(0, (startH - HOUR_START) * PX_PER_HOUR) + 1
  const height = Math.max(22, (endH - startH) * PX_PER_HOUR - 3)
  const tone = toUiTone(missionStatusTone[mission.status] ?? 'gray')

  return (
    <button
      type="button"
      className={`mng-chip is-${tone}${selected ? ' is-selected' : ''}`}
      style={{
        top,
        height,
        left: `calc(${(lane / lanes) * 100}% + 3px)`,
        width: `calc(${100 / lanes}% - 6px)`,
        right: 'auto',
      }}
      onClick={() => onSelect(mission)}
      aria-pressed={selected}
      aria-label={`${mission.missionCode} ${missionStatusLabel}`}
      title={`${mission.missionCode} · ${missionStatusLabel}`}
    >
      <span className="mng-chip-code">{mission.missionCode.slice(-6)}</span>
      {mission.droneCode && (
        <span className="mng-chip-sub">
          {mission.droneCode}
          {mission.operatorName
            ? ` · ${mission.operatorName.split(' ').at(-1)}`
            : ''}
        </span>
      )}
    </button>
  )
}
