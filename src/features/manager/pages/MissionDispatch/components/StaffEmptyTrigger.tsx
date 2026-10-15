import { ManagerIcon } from '../../../components/common/ManagerIcon'
import type { MissionStaffRole } from '../../../../mission/types/mission'
import type { RefObject } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { staffEmptyTriggerMessages } from './StaffEmptyTrigger.messages'

export function StaffEmptyTrigger({
  triggerRef,
  openPicker,
  role,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>
  openPicker: () => void
  role: MissionStaffRole
}) {
  const { t } = useI18n(staffEmptyTriggerMessages)
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={openPicker}
      aria-label={t.chooseOperatorAria(t.roles[role])}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        width: '100%',
        minHeight: 42,
        padding: '0 12px',
        border: '1px solid #cbd5e1',
        borderRadius: 10,
        background: '#fff',
        color: '#64748b',
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
        <ManagerIcon name="maintenance" size={16} />
        {t.chooseStaff}
      </span>
      <span aria-hidden="true" style={{ color: '#94a3b8' }}>
        ⌄
      </span>
    </button>
  )
}
