import type { MissionCalendarItem } from '../../../types/missions'
import { useLanguage } from '../../../../../shared/i18n'
import {
  missionStatusTone,
  getMissionStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { toUiTone } from '../../../../../shared/components/ui'

export function ActiveMissionItem({
  mission,
  selected,
  onSelect,
}: {
  mission: MissionCalendarItem
  selected: boolean
  onSelect: () => void
}) {
  const { lang } = useLanguage()
  const tone = toUiTone(missionStatusTone[mission.status] ?? 'gray')
  const label = getMissionStatusLabel(mission.status, lang) ?? mission.status

  return (
    <button
      type="button"
      className={`odm-live-item${selected ? ' active' : ''}`}
      onClick={onSelect}
      aria-pressed={selected}
      title={label}
    >
      <span className={`odm-live-dot is-${tone}`} aria-hidden="true" />
      <span className="odm-live-item-code">
        {mission.missionCode}
        <span className="mng-sr-only"> · {label}</span>
      </span>
      <span className="odm-live-item-title">
        {mission.serviceLabel ?? mission.addressText ?? '—'}
      </span>
      <span className="odm-live-item-meta">
        {mission.droneCode ?? '—'}
        {mission.operatorName
          ? ` · ${mission.operatorName.split(' ').slice(-2).join(' ')}`
          : ''}
      </span>
    </button>
  )
}
