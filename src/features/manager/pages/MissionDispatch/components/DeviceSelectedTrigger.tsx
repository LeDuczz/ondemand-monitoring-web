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
      style={{
        display: 'grid',
        gap: 8,
        width: '100%',
        minHeight: 74,
        padding: 10,
        border: '1px solid #bfdbfe',
        borderRadius: 12,
        background: '#eff6ff',
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      {selectedDevices.map((device) => {
        const [serial, modelPart] = device.label.split(' (')
        const model = modelPart ? modelPart.replace(/\)$/, '') : t.unknownModel
        return (
          <span
            key={device.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '36px minmax(0, 1fr) auto',
              gap: 10,
              alignItems: 'center',
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
              role="button"
              tabIndex={0}
              aria-label={`${t.clearDevice} ${device.label}`}
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
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                display: 'inline-grid',
                placeItems: 'center',
                color: '#64748b',
                background: '#fff',
                border: '1px solid #dbeafe',
                fontSize: 18,
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
