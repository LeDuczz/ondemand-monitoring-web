import { useMemo } from 'react'
import type { DroneCameraTelemetry } from './components/DroneCameraView'
import type { ControlStatus } from './inFlightTypes'

/** Battery readings and the camera telemetry derived from the controller status. */
export function useFlightTelemetry(controlStatus: ControlStatus | null) {
  const liveBatteryPercent =
    typeof controlStatus?.batteryPercent === 'number' &&
    Number.isFinite(controlStatus.batteryPercent)
      ? controlStatus.batteryPercent
      : typeof controlStatus?.rawPx4BatteryPercent === 'number' &&
          Number.isFinite(controlStatus.rawPx4BatteryPercent)
        ? controlStatus.rawPx4BatteryPercent
        : undefined

  // Camera view reads the SAME GPS telemetry as the main flight map (controlStatus.positionGps).
  const cameraTelemetry = useMemo<DroneCameraTelemetry | null>(() => {
    const gps = controlStatus?.positionGps
    if (!gps) return null
    return {
      latitude: gps.latitude,
      longitude: gps.longitude,
      heading: controlStatus?.yawDeg ?? null,
      altitude: gps.relativeAltitudeM ?? controlStatus?.altitudeM ?? null,
      speedMps: controlStatus?.speedMps ?? null,
      batteryPercent: liveBatteryPercent ?? null,
    }
  }, [
    controlStatus?.positionGps?.latitude,
    controlStatus?.positionGps?.longitude,
    controlStatus?.positionGps?.relativeAltitudeM,
    controlStatus?.yawDeg,
    controlStatus?.altitudeM,
    controlStatus?.speedMps,
    liveBatteryPercent,
  ])

  const telemetryBattery =
    typeof liveBatteryPercent === 'number' &&
    Number.isFinite(liveBatteryPercent)
      ? Math.max(0, Math.min(100, liveBatteryPercent))
      : null
  const batteryDisplay =
    telemetryBattery === null ? '--' : `${telemetryBattery.toFixed(1)}%`
  const batteryState = controlStatus?.batteryState ?? 'NORMAL'
  const showBatteryWarning =
    telemetryBattery !== null && batteryState !== 'NORMAL'

  return {
    cameraTelemetry,
    telemetryBattery,
    batteryDisplay,
    batteryState,
    showBatteryWarning,
  } as const
}
