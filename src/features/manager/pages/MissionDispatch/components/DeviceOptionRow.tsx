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
      style={{
        display: 'grid',
        gridTemplateColumns: '36px minmax(0, 1fr) auto',
        gap: 10,
        alignItems: 'center',
        width: '100%',
        minHeight: 62,
        padding: '8px 10px',
        border: 0,
        borderRadius: 10,
        background: isSelected ? '#eff6ff' : isActive ? '#f8fafc' : '#fff',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          display: 'grid',
          placeItems: 'center',
          background: '#dbeafe',
          color: '#2563eb',
        }}
      >
        <ManagerIcon name="drones" size={18} />
      </span>
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'block',
            fontSize: 14,
            fontWeight: 700,
            color: '#0f172a',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {serial || t.device}
        </span>
        <span
          style={{
            display: 'block',
            marginTop: 2,
            fontSize: 12,
            color: '#64748b',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {model}
        </span>
        <span style={{ display: 'block', marginTop: 5 }}>
          <StaffStatusBadge />
        </span>
      </span>
      <span
        style={{
          color: isSelected ? '#2563eb' : 'transparent',
          fontSize: 18,
          fontWeight: 900,
        }}
      >
        ✓
      </span>
    </button>
  )
}
