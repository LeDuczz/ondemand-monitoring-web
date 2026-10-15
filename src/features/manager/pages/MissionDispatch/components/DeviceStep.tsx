import { Card, StatusBadge } from '../../../../../shared/components/ui'
import { DeviceCombobox } from './DeviceCombobox'
import type { MissionStaffRole } from '../../../../mission/types/mission'
import type { AvailableDrone } from '../../../../staff/api/droneApi'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { deviceStepMessages } from './DeviceStep.messages'

export function DeviceStep({
  selectedDrones,
  drones,
  droneIds,
  devicePickerOpen,
  setDevicePickerOpen,
  setOpenStaffRole,
  setDroneIds,
  setError,
}: {
  selectedDrones: AvailableDrone[]
  drones: { data: AvailableDrone[] | undefined; reload: () => void }
  droneIds: string[]
  devicePickerOpen: boolean
  setDevicePickerOpen: Dispatch<SetStateAction<boolean>>
  setOpenStaffRole: Dispatch<SetStateAction<MissionStaffRole | null>>
  setDroneIds: Dispatch<SetStateAction<string[]>>
  setError: Dispatch<SetStateAction<string | null>>
}) {
  const { t } = useI18n(deviceStepMessages)
  return (
    <Card
      title={t.step2}
      actions={
        selectedDrones.length > 0 ? (
          <StatusBadge tone="info">
            {t.deviceSelectedCount(selectedDrones.length)}
          </StatusBadge>
        ) : null
      }
    >
      <div className="odm-dp-stack">
        <p className="odm-dp-help">
          {t.deviceHelp} {t.deviceAvailabilityHint}
        </p>
        {!drones.data?.length ? (
          <p className="odm-dp-empty">{t.noAvailableDrones}</p>
        ) : (
          <section className="odm-dp-role">
            <span className="odm-dp-role-head">
              <span>{t.selectedDevice}</span>
            </span>
            <span className="odm-dp-role-desc">
              {selectedDrones.length > 0
                ? t.deviceSelectedCount(selectedDrones.length)
                : t.chooseDroneOption}
            </span>
            <DeviceCombobox
              devices={drones.data ?? []}
              selectedIds={droneIds}
              open={devicePickerOpen}
              onOpen={() => {
                setDevicePickerOpen(true)
                setOpenStaffRole(null)
              }}
              onClose={() => setDevicePickerOpen(false)}
              onToggle={(deviceId) => {
                setDroneIds((currentIds) =>
                  currentIds.includes(deviceId)
                    ? currentIds.filter((id) => id !== deviceId)
                    : [...currentIds, deviceId],
                )
                setError(null)
              }}
              onRemove={(deviceId) => {
                setDroneIds((currentIds) =>
                  currentIds.filter((id) => id !== deviceId),
                )
                setError(null)
              }}
              onClear={() => {
                setDroneIds([])
                setError(null)
              }}
            />
          </section>
        )}
      </div>
    </Card>
  )
}
