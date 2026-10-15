import { StatCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { DroneResponse } from '../../../types/drones'
import { matchesFilter } from '../droneHelpers'
import { dronesStatsMessages } from './DronesStats.messages'

/** KPI strip per status group, computed from the loaded list. */
export function DronesStats({ drones }: { drones: DroneResponse[] }) {
  const { t } = useI18n(dronesStatsMessages)
  const count = (filter: Parameters<typeof matchesFilter>[1]) =>
    drones.filter((d) => matchesFilter(d, filter)).length
  const maintenance = count('MAINTENANCE')
  const outOfService = count('OUT_OF_SERVICE')
  return (
    <div className="mng-stats">
      <StatCard label={t.available} value={count('AVAILABLE')} tone="success" />
      <StatCard label={t.flying} value={count('FLYING')} />
      <StatCard
        label={t.maintenance}
        value={maintenance}
        tone={maintenance > 0 ? 'warning' : 'default'}
      />
      <StatCard
        label={t.outOfService}
        value={outOfService}
        tone={outOfService > 0 ? 'danger' : 'default'}
      />
    </div>
  )
}
