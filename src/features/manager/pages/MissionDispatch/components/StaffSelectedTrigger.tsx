import { StaffAvatar } from './StaffAvatar'
import { StaffStatusBadge } from './StaffStatusBadge'
import type { AvailableOperator } from '../../../../staff/api/operatorApi'
import type { RefObject } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { staffSelectedTriggerMessages } from './StaffSelectedTrigger.messages'

export function StaffSelectedTrigger({
  triggerRef,
  openPicker,
  selectedStaff,
  onRemove,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>
  openPicker: () => void
  selectedStaff: AvailableOperator[]
  onRemove: (staffId: string) => void
}) {
  const { t } = useI18n(staffSelectedTriggerMessages)
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={openPicker}
      className="odm-dp-selected"
    >
      {selectedStaff.map((selected) => (
        <span key={selected.id} className="odm-dp-selected-item">
          <StaffAvatar staff={selected} />
          <span className="odm-dp-body">
            <span className="odm-dp-name">{selected.fullName}</span>
            <span className="odm-dp-sub">{selected.email}</span>
            <span>
              <StaffStatusBadge />
            </span>
          </span>
          <span
            role="button"
            tabIndex={0}
            aria-label={t.clearStaff}
            className="odm-dp-x"
            onClick={(event) => {
              event.stopPropagation()
              onRemove(selected.id)
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                event.stopPropagation()
                onRemove(selected.id)
              }
            }}
          >
            ×
          </span>
        </span>
      ))}
    </button>
  )
}
