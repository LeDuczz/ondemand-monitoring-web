import { type DeliveryStatus } from '../missionsHelpers'
import type { MissionCalendarItem } from '../../../types/missions'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { missionsTableMessages } from './MissionsTable.messages'
import { MissionRow } from './MissionRow'

export function MissionsTable({
  query,
  missions,
  selectedMission,
  setSelectedMission,
  deliveryStatuses,
  orderDeliveryStatuses,
}: {
  query: UseApiQueryState<{ items: MissionCalendarItem[] }>
  missions: MissionCalendarItem[]
  selectedMission: string | null
  setSelectedMission: Dispatch<SetStateAction<string | null>>
  deliveryStatuses: Record<string, DeliveryStatus>
  orderDeliveryStatuses: Record<string, DeliveryStatus>
}) {
  const { t } = useI18n(missionsTableMessages)
  const columns = [
    t.columns.mission,
    t.columns.order,
    t.columns.attempt,
    t.columns.schedule,
    t.columns.drone,
    t.columns.operator,
    t.columns.status,
    t.columns.delivery,
    '',
  ]
  return (
    <>
      {!query.loading && !query.error && missions.length > 0 && (
        <section className="odm-or-card odm-or-table-card">
          <div className="odm-or-table-scroll">
            <table className="odm-or-table">
              <thead>
                <tr>
                  {columns.map((label, index) => (
                    <th key={index}>{label}</th>
                  ))}
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
          </div>
        </section>
      )}
    </>
  )
}
