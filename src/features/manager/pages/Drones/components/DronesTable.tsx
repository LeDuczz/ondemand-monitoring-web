import type { DroneResponse } from '../../../types/drones'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { PageResponseDroneResponse } from '../../../types/drones'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
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
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--tx3)',
                  textAlign: 'left',
                }}
              >
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.drone}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.model}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.status}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.battery}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.station}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.payload}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.flightHours}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }}>
                  {t.columns.lastActivity}
                </th>
                <th style={{ padding: '8px 12px', fontWeight: 500 }} />
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
        </div>
      )}
    </>
  )
}
