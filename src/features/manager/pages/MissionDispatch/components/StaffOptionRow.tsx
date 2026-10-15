import { StaffAvatar } from './StaffAvatar'
import { StaffStatusBadge } from './StaffStatusBadge'
import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import type { Dispatch, SetStateAction } from 'react'
import type { MissionStaffRole } from '../../../../mission/types/mission'
import { useI18n } from '../../../../../shared/i18n'
import { staffOptionRowMessages } from './StaffOptionRow.messages'

export function StaffOptionRow({
  item,
  setActiveIndex,
  index,
  choose,
  isSelected,
  isActive,
  usedRoles,
}: {
  item: AvailableOperator
  setActiveIndex: Dispatch<SetStateAction<number>>
  index: number
  choose: (item: AvailableOperator) => void
  isSelected: boolean
  isActive: boolean
  usedRoles: MissionStaffRole[]
}) {
  const { t } = useI18n(staffOptionRowMessages)
  return (
    <button
      type="button"
      onMouseEnter={() => setActiveIndex(index)}
      onClick={() => choose(item)}
      className={`odm-dp-row${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
    >
      <StaffAvatar staff={item} />
      <span className="odm-dp-body">
        <span className="odm-dp-name-line">
          <span className="odm-dp-name">{item.fullName}</span>
          {usedRoles.map((usedRole) => (
            <span key={usedRole} className="odm-dp-roletag">
              {t.roles[usedRole]}
            </span>
          ))}
        </span>
        <span className="odm-dp-sub">{item.email}</span>
        <span>
          <StaffStatusBadge />
        </span>
      </span>
      <span className="odm-dp-row-tick">✓</span>
    </button>
  )
}
