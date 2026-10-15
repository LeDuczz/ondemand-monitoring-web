import { useMemo } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { evaluateGeofence, statusToSimulationPoint } from './geofence'
import type { ControlStatus } from './inFlightTypes'
import { geofenceMessages } from './useGeofence.messages'
import { useRestrictedZones } from './useRestrictedZones'

export function useGeofence(controlStatus: ControlStatus | null) {
  const { t } = useI18n(geofenceMessages)
  const restrictedZones = useRestrictedZones()
  const dronePoint = statusToSimulationPoint(controlStatus)
  const geofenceStatus = useMemo(
    () => evaluateGeofence(dronePoint, restrictedZones),
    [dronePoint, restrictedZones],
  )
  const geofenceAlertActive =
    geofenceStatus.level === 'CAUTION' ||
    geofenceStatus.level === 'DANGER' ||
    geofenceStatus.level === 'VIOLATION'
  const geofenceTone =
    geofenceStatus.level === 'VIOLATION' || geofenceStatus.level === 'DANGER'
      ? 'danger'
      : 'amber'
  const geofenceZoneName =
    geofenceStatus.zone?.name ??
    geofenceStatus.zone?.code ??
    t.restrictedZoneFallback
  const geofenceMessage =
    geofenceStatus.level === 'VIOLATION'
      ? t.breach(geofenceZoneName)
      : geofenceStatus.level === 'DANGER'
        ? t.danger(Math.round(geofenceStatus.distanceM ?? 0), geofenceZoneName)
        : geofenceStatus.level === 'CAUTION'
          ? t.caution(
              Math.round(geofenceStatus.distanceM ?? 0),
              geofenceZoneName,
            )
          : t.allNominal
  const footerStatusColor = geofenceAlertActive
    ? geofenceTone === 'danger'
      ? '#fecaca'
      : '#fde68a'
    : '#bbf7d0'
  const footerStatusDot = geofenceAlertActive
    ? geofenceTone === 'danger'
      ? '#ef4444'
      : '#f59e0b'
    : '#22c55e'

  return {
    geofenceStatus,
    geofenceAlertActive,
    geofenceTone,
    geofenceMessage,
    footerStatusColor,
    footerStatusDot,
  } as const
}
