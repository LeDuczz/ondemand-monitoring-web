import { ManagerIcon } from '../../../components/common/ManagerIcon'
import type { RefObject } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { deviceEmptyTriggerMessages } from './DeviceEmptyTrigger.messages'

export function DeviceEmptyTrigger({
  triggerRef,
  openPicker,
}: {
  triggerRef: RefObject<HTMLButtonElement | null>
  openPicker: () => void
}) {
  const { t } = useI18n(deviceEmptyTriggerMessages)
  return (
    <button
      ref={triggerRef}
      type="button"
      onClick={openPicker}
      aria-label={t.chooseDroneAria}
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
        <ManagerIcon name="drones" size={16} />
        {t.chooseDroneOption}
      </span>
      <span aria-hidden="true" style={{ color: '#94a3b8' }}>
        ⌄
      </span>
    </button>
  )
}
