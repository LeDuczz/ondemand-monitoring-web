import { ManagerIcon } from '../../../components/common/ManagerIcon'
import { StaffStatusBadge } from './StaffStatusBadge'
import type { AvailableDrone } from '../../../../staff/api/droneApi'
import type { RefObject } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { deviceSelectedTriggerMessages } from './DeviceSelectedTrigger.messages'

export function DeviceSelectedTrigger({
  triggerRef,
  openPicker,
  selectedDevices,
  onRemove,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>
  openPicker: () => void
  selectedDevices: AvailableDrone[]
  onRemove: (deviceId: string) => void
}) {
  const { t } = useI18n(deviceSelectedTriggerMessages)
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={openPicker}
      className="odm-dp-selected"
    >
      {selectedDevices.map((device) => {
        const [serial, modelPart] = device.label.split(' (')
        const model = modelPart ? modelPart.replace(/\)$/, '') : t.unknownModel
        return (
          <span key={device.id} className="odm-dp-selected-item">
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
            <span
              role="button"
              tabIndex={0}
              aria-label={`${t.clearDevice} ${device.label}`}
              className="odm-dp-x"
              onClick={(event) => {
                event.stopPropagation()
                onRemove(device.id)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  event.stopPropagation()
                  onRemove(device.id)
                }
              }}
            >
              ×
            </span>
          </span>
        )
      })}
    </button>
  )
}
