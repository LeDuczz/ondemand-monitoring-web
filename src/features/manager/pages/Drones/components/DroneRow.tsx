import { MANUAL_TRANSITIONS } from '../droneHelpers'
import { StatusBadge, toUiTone } from '../../../../../shared/components/ui'
import {
  droneStatusTone,
  getDroneStatusLabel,
} from '../../../../../shared/lib/statusTone'
import type { DroneResponse } from '../../../types/drones'
import type { Dispatch, SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { droneRowMessages } from './DroneRow.messages'

export function DroneRow({
  drone,
  setChangingDrone,
}: {
  drone: DroneResponse
  setChangingDrone: Dispatch<SetStateAction<DroneResponse | null>>
}) {
  const { t, lang, locale } = useI18n(droneRowMessages)
  const canChange = (MANUAL_TRANSITIONS[drone.status]?.length ?? 0) > 0
  const model = [drone.droneModel?.manufacturer, drone.droneModel?.modelCode]
    .filter(Boolean)
    .join(' ')
  const updated = drone.updatedAt ? new Date(drone.updatedAt) : null
  return (
    <tr>
      <td>
        <div className="mng-cell-main odm-mono">{drone.serialNumber}</div>
        <div className="mng-cell-sub">{model || '—'}</div>
      </td>
      <td>{drone.dronePayload?.modelName ?? '—'}</td>
      <td>
        <StatusBadge tone={toUiTone(droneStatusTone[drone.status])}>
          {getDroneStatusLabel(drone.status, lang)}
        </StatusBadge>
      </td>
      <td className="mng-nowrap">
        {updated && !Number.isNaN(updated.getTime())
          ? updated.toLocaleString(locale, {
              dateStyle: 'short',
              timeStyle: 'short',
            })
          : '—'}
      </td>
      <td className="mng-actions">
        {canChange && (
          <button
            type="button"
            className="odm-btn odm-btn-sm"
            onClick={() => setChangingDrone(drone)}
          >
            {t.changeStatus}
          </button>
        )}
      </td>
    </tr>
  )
}
