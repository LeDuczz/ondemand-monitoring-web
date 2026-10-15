import type { DroneResponse } from '../../../types/drones'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { PageResponseDroneResponse } from '../../../types/drones'
import type { Dispatch, SetStateAction } from 'react'
import { TableCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { dronesTableMessages } from './DronesTable.messages'
import { DroneRow } from './DroneRow'

export function DronesTable({
  query,
  visible,
  setChangingDrone,
}: {
  query: UseApiQueryState<PageResponseDroneResponse>
  visible: DroneResponse[]
  setChangingDrone: Dispatch<SetStateAction<DroneResponse | null>>
}) {
  const { t } = useI18n(dronesTableMessages)
  return (
    <>
      {!query.loading && !query.error && visible.length > 0 && (
        <TableCard>
          <table className="mng-table">
            <thead>
              <tr>
                <th>{t.columns.drone}</th>
                <th>{t.columns.payload}</th>
                <th>{t.columns.status}</th>
                <th>{t.columns.lastActivity}</th>
                <th>
                  <span className="mng-sr-only">{t.columns.actions}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((drone) => (
                <DroneRow
                  key={drone.id}
                  drone={drone}
                  setChangingDrone={setChangingDrone}
                />
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
    </>
  )
}
