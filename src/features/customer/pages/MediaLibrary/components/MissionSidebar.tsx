import { useI18n } from '../../../../../shared/i18n'
import type { MediaMissionGroup } from '../../../lib/media/types'
import { missionSidebarMessages } from './MissionSidebar.messages'

type Props = {
  groups: MediaMissionGroup[]
  total: number
  selected: string | null
  onSelect: (missionId: string | null) => void
}

export function MissionSidebar({ groups, total, selected, onSelect }: Props) {
  const { t } = useI18n(missionSidebarMessages)
  const item = (id: string | null, label: string, count: number) => (
    <li key={id ?? 'all'}>
      <button
        type="button"
        className={`ml-mission${selected === id ? ' is-active' : ''}`}
        aria-pressed={selected === id}
        onClick={() => onSelect(id)}
      >
        <span className="ml-mission-label">{label}</span>
        <span className="ml-mission-count">{count}</span>
      </button>
    </li>
  )
  return (
    <div className="ml-missions-group" role="group" aria-label={t.heading}>
      <span className="ml-field-label">{t.heading}</span>
      <ul className="ml-missions">
        {item(null, t.all, total)}
        {groups.map((g) => item(g.missionId, g.label, g.count))}
      </ul>
    </div>
  )
}
