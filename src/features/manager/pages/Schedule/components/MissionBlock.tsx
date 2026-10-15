import { toLocalHours, HOUR_START, PX_PER_HOUR } from '../scheduleHelpers'
import { toUiTone } from '../../../../../shared/components/ui'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import type { MissionCalendarItem } from '../../../types/missions'

type MissionBlockProps = {
  mission: MissionCalendarItem
  selected: boolean
  onSelect: (m: MissionCalendarItem) => void
  missionStatusLabel: string
}

/** Rounded, status-coloured chip positioned on the time grid. */
export function MissionBlock({
  mission,
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

  const top = Math.max(0, (startH - HOUR_START) * PX_PER_HOUR) + 1
  const height = Math.max(22, (endH - startH) * PX_PER_HOUR - 3)
  const tone = toUiTone(missionStatusTone[mission.status] ?? 'gray')

  return (
    <button
      type="button"
      className={`mng-chip is-${tone}${selected ? ' is-selected' : ''}`}
      style={{ top, height }}
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
