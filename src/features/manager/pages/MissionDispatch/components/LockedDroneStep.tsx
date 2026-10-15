import type { DroneCandidate } from '../../../types/missions'
import { LockedDroneCard } from './LockedDroneCard'
import { useI18n } from '../../../../../shared/i18n'
import { lockedDroneStepMessages } from './LockedDroneStep.messages'

export type LockedDrone = {
  candidate: DroneCandidate | null
  code: string
  name: string
  assignmentId: string
}

export function LockedDroneStep({ lockedDrone }: { lockedDrone: LockedDrone }) {
  const { t } = useI18n(lockedDroneStepMessages)
  return (
    <div
      className="odm-card"
      style={{
        marginBottom: 14,
        borderLeft: '3px solid var(--blue-solid)',
      }}
    >
      <div className="odm-card-header" style={{ color: 'var(--blue-solid)' }}>
        {t.step1Done}
      </div>
      {lockedDrone.candidate ? (
        <LockedDroneCard drone={lockedDrone.candidate} />
      ) : (
        <div className="odm-card-body" style={{ fontWeight: 700 }}>
          {lockedDrone.code} · {lockedDrone.name}
        </div>
      )}
    </div>
  )
}
