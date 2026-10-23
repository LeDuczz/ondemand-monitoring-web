import { StatCard } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import type { DroneGroup } from '../droneHelpers'
import { dronesPageMessages } from '../DronesPage.messages'

export function DronesStats({ counts }: { counts: Record<DroneGroup, number> }) {
  const { t } = useI18n(dronesPageMessages)
  return (
    <div className="odm-or-stats">
      <StatCard
        label={t.stats.available}
        value={counts.available}
        hint={t.stats.availableHint}
        tone={counts.available > 0 ? 'success' : 'default'}
      />
      <StatCard
        label={t.stats.inMission}
        value={counts.inMission}
        hint={t.stats.inMissionHint}
      />
      <StatCard
        label={t.stats.maintenance}
        value={counts.maintenance}
        hint={t.stats.maintenanceHint}
        tone={counts.maintenance > 0 ? 'warning' : 'default'}
      />
      <StatCard
        label={t.stats.outOfService}
        value={counts.outOfService}
        hint={t.stats.outOfServiceHint}
        tone={counts.outOfService > 0 ? 'danger' : 'default'}
      />
    </div>
  )
}
