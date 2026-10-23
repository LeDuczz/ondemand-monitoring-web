import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { Button } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { droneStatusTone } from '../../../../../shared/lib/statusTone'
import type { DeviceResponse } from '../../../types/drones'
import { MANUAL_TRANSITIONS } from '../droneHelpers'
import { dronesPageMessages } from '../DronesPage.messages'

export function DroneRow({
  drone,
  onChangeStatus,
}: {
  drone: DeviceResponse
  onChangeStatus: (drone: DeviceResponse) => void
}) {
  const { t, locale } = useI18n(dronesPageMessages)
  const canChange = (MANUAL_TRANSITIONS[drone.status]?.length ?? 0) > 0
  const model = drone.deviceModel
  return (
    <tr>
      <td>
        <div className="odm-or-cell-main odm-mono">{drone.serialNumber}</div>
        <div className="odm-or-cell-sub">{drone.name || t.unnamed}</div>
      </td>
      <td>
        <div className="odm-or-cell-main">
          {model?.modelName ?? model?.code ?? '—'}
        </div>
        {model?.manufacturer ? (
          <div className="odm-or-cell-sub">{model.manufacturer}</div>
        ) : null}
      </td>
      <td>
        <StatusBadge
          kind="drone"
          status={drone.status}
          tone={droneStatusTone[drone.status]}
        />
      </td>
      <td>
        {drone.updatedAt ? new Date(drone.updatedAt).toLocaleString(locale) : '—'}
      </td>
      <td className="odm-or-table-action">
        {canChange && (
          <Button size="sm" onClick={() => onChangeStatus(drone)}>
            {t.changeStatus}
          </Button>
        )}
      </td>
    </tr>
  )
}
