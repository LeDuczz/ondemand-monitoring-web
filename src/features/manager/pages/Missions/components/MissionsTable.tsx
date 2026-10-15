import { type DeliveryStatus } from '../missionsHelpers'
import type { MissionCalendarItem } from '../../../types/missions'
import type { Dispatch, SetStateAction } from 'react'
import { TableCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { missionsTableMessages } from './MissionsTable.messages'
import { MissionRow } from './MissionRow'

export function MissionsTable({
  missions,
  selectedMission,
  setSelectedMission,
  deliveryStatuses,
  orderDeliveryStatuses,
}: {
  missions: MissionCalendarItem[]
  selectedMission: string | null
  setSelectedMission: Dispatch<SetStateAction<string | null>>
  deliveryStatuses: Record<string, DeliveryStatus>
  orderDeliveryStatuses: Record<string, DeliveryStatus>
}) {
  const { t } = useI18n(missionsTableMessages)
  return (
    <TableCard>
      <table className="mng-table">
        <thead>
          <tr>
            <th>{t.columns.mission}</th>
            <th>{t.columns.schedule}</th>
            <th>{t.columns.drone}</th>
            <th>{t.columns.operator}</th>
            <th>{t.columns.status}</th>
            <th>{t.columns.delivery}</th>
            <th>
              <span className="mng-sr-only">{t.columns.actions}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {missions.map((m) => (
            <MissionRow
              key={m.id}
              m={m}
              selectedMission={selectedMission}
              setSelectedMission={setSelectedMission}
              deliveryStatuses={deliveryStatuses}
              orderDeliveryStatuses={orderDeliveryStatuses}
            />
          ))}
        </tbody>
      </table>
    </TableCard>
  )
}
