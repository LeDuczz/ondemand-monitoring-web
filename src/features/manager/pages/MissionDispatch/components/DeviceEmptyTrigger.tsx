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
      className="odm-dp-trigger"
    >
      <span>
        <ManagerIcon name="drones" size={16} />
        {t.chooseDroneOption}
      </span>
      <span aria-hidden="true">⌄</span>
    </button>
  )
}
