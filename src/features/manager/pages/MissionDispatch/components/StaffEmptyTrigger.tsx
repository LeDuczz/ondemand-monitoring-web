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
      className="odm-dp-trigger"
    >
      <span>
        <ManagerIcon name="maintenance" size={16} />
        {t.chooseStaff}
      </span>
      <span aria-hidden="true">⌄</span>
    </button>
  )
}
