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
      <StaffAvatar staff={item} />
      <span style={{ minWidth: 0 }}>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#0f172a',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {item.fullName}
          </span>
          {usedRoles.map((usedRole) => (
            <span
              key={usedRole}
              style={{
                borderRadius: 999,
                padding: '2px 7px',
                background: '#e0f2fe',
                color: '#0369a1',
                fontSize: 11,
                fontWeight: 700,
                flex: '0 0 auto',
              }}
            >
              {t.roles[usedRole]}
            </span>
          ))}
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
          {item.email}
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
