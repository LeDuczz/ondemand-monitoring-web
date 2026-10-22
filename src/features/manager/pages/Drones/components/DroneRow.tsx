import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import {
  droneStatusTone,
  getDroneStatusLabel,
} from '../../../../../shared/lib/statusTone'
import { dronesPageMessages } from '../DronesPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { DeviceResponse } from '../../../types/drones'
import type { Dispatch, SetStateAction } from 'react'
import { Button } from '../../../../../shared/components/ui'

export function DroneRow({
  drone,
  canChange,
  setChangingDrone,
}: {
  drone: DeviceResponse
  canChange: boolean
  setChangingDrone: Dispatch<SetStateAction<DeviceResponse | null>>
}) {
  const { t, lang, locale } = useI18n(dronesPageMessages)
  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '8px 12px', fontWeight: 500 }}>
        {drone.name || drone.serialNumber}
        {drone.name ? (
          <span
            style={{
              fontWeight: 400,
              color: 'var(--tx2)',
              marginLeft: 4,
            }}
          >
            {drone.serialNumber}
          </span>
        ) : null}
      </td>
      <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
        {drone.deviceModel?.modelName ?? drone.deviceModel?.code ?? '—'}
      </td>
      <td style={{ padding: '8px 12px' }}>
        <StatusBadge tone={droneStatusTone[drone.status]}>
          {getDroneStatusLabel(drone.status, lang)}
        </StatusBadge>
      </td>
      <td style={{ padding: '8px 12px', color: 'var(--tx2)' }}>
        {drone.updatedAt
          ? new Date(drone.updatedAt).toLocaleString(locale)
          : '—'}
      </td>
      <td style={{ padding: '8px 12px' }}>
        {canChange && (
          <Button
            type="button"
            style={{ fontSize: 12 }}
            onClick={() => setChangingDrone(drone)}
          >
            {t.changeStatus}
          </Button>
        )}
      </td>
    </tr>
  )
}
