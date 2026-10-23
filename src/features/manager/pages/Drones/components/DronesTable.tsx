import { TableCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { DeviceResponse } from '../../../types/drones'
import { dronesPageMessages } from '../DronesPage.messages'
import { DroneRow } from './DroneRow'

export function DronesTable({
  visible,
  total,
  onChangeStatus,
}: {
  visible: DeviceResponse[]
  total: number
  onChangeStatus: (drone: DeviceResponse) => void
}) {
  const { t } = useI18n(dronesPageMessages)
  return (
    <TableCard footer={t.resultCount(visible.length, total)}>
      <table className="odm-or-table odm-or-table-static">
        <thead>
          <tr>
            <th>{t.columns.device}</th>
            <th>{t.columns.model}</th>
            <th>{t.columns.status}</th>
            <th>{t.columns.updated}</th>
            <th className="odm-or-table-action">{t.columns.actions}</th>
          </tr>
        </thead>
        <tbody>
          {visible.map((drone) => (
            <DroneRow key={drone.id} drone={drone} onChangeStatus={onChangeStatus} />
          ))}
        </tbody>
      </table>
    </TableCard>
  )
}
