import { ManagerIcon } from '../../../components/common/ManagerIcon'
import { StaffStatusBadge } from './StaffStatusBadge'
import type { AvailableDrone } from '../../../../staff/api/droneApi'
import type { Dispatch, SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { deviceOptionRowMessages } from './DeviceOptionRow.messages'

export function DeviceOptionRow({
  item,
  isSelected,
  setActiveIndex,
  index,
  choose,
  isActive,
  serial,
  model,
}: {
  item: AvailableDrone
  isSelected: boolean
  setActiveIndex: Dispatch<SetStateAction<number>>
  index: number
  choose: (item: AvailableDrone) => void
  isActive: boolean
  serial: string
  model: string
}) {
  const { t } = useI18n(deviceOptionRowMessages)
  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      aria-label={`${t.chooseDroneAria} ${item.label}`}
      onMouseEnter={() => setActiveIndex(index)}
      onClick={() => choose(item)}
      className={`odm-dp-row${isSelected ? ' is-selected' : ''}${isActive ? ' is-active' : ''}`}
    >
      <span aria-hidden="true" className="odm-dp-icon">
        <ManagerIcon name="drones" size={18} />
      </span>
      <span className="odm-dp-body">
        <span className="odm-dp-name">{serial || t.device}</span>
        <span className="odm-dp-sub">{model}</span>
        <span>
          <StaffStatusBadge />
        </span>
      </span>
      <span className="odm-dp-row-tick">✓</span>
    </button>
  )
}
