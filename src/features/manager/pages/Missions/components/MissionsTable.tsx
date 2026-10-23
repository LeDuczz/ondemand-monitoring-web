import { TableCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { MissionCalendarItem } from '../../../types/missions'
import type { Dispatch, SetStateAction } from 'react'
import { missionsPageMessages } from '../MissionsPage.messages'
import type { DeliveryStatus } from '../missionsTypes'
import { MissionRow } from './MissionRow'

export function MissionsTable({
  missions,
  total,
  selectedMission,
  setSelectedMission,
  deliveryStatuses,
  orderDeliveryStatuses,
}: {
  missions: MissionCalendarItem[]
  total: number
  selectedMission: string | null
  setSelectedMission: Dispatch<SetStateAction<string | null>>
  deliveryStatuses: Record<string, DeliveryStatus>
  orderDeliveryStatuses: Record<string, DeliveryStatus>
}) {
  const { t } = useI18n(missionsPageMessages)
  return (
    <TableCard footer={t.resultCount(missions.length, total)}>
      <table className="mgr-table">
        <thead>
          <tr>
            <th>{t.columns.mission}</th>
            <th>{t.columns.schedule}</th>
            <th>{t.columns.drone}</th>
            <th>{t.columns.crew}</th>
            <th>{t.columns.status}</th>
            <th>{t.columns.delivery}</th>
            <th className="is-right">{t.columns.action}</th>
          </tr>
        </thead>
        <tbody>
          {missions.map((m) => (
            <MissionRow
              key={m.id}
              selectedMission={selectedMission}
              m={m}
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
