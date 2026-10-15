import { DroneCard } from './DroneCard'
import type { ResourceSuggestions } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { droneStepCardMessages } from './DroneStepCard.messages'

export function DroneStepCard({
  suggestions,
  lockingDrone,
  handleLockDrone,
}: {
  suggestions: ResourceSuggestions
  lockingDrone: boolean
  handleLockDrone: (droneCode: string) => Promise<void>
}) {
  const { t } = useI18n(droneStepCardMessages)
  return (
    <div className="odm-card" style={{ marginBottom: 14 }}>
      <div className="odm-card-header">
        {t.step1Choose}
        <span style={{ fontWeight: 500, color: 'var(--tx3)', fontSize: 11.5 }}>
          {t.topOf(
            suggestions.topDrones.length,
            suggestions.eligibleDroneCount,
          )}
        </span>
      </div>
      {suggestions.topDrones.map((d, i) => (
        <DroneCard
          key={d.code}
          rank={i + 1}
          drone={d}
          locking={lockingDrone}
          onLock={() => handleLockDrone(d.code)}
        />
      ))}
    </div>
  )
}
