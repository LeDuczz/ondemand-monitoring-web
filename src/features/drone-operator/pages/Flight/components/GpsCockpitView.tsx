import { useI18n } from '../../../../../shared/i18n'
import { isInsideHcmcServiceArea } from '../../../../../shared/lib/serviceArea'
import type { Drone, Mission } from '../../../types/omss'
import { gpsDistanceMeters } from '../gpsRoutePlanner'
import type { ControlStatus, FlightCommand } from '../inFlightTypes'
import { DroneCameraView, type DroneCameraTelemetry } from './DroneCameraView'
import { FlightCockpit } from './FlightCockpit'
import { gpsCockpitViewMessages } from './GpsCockpitView.messages'
import { ManualCockpitPreflight } from './ManualCockpitPreflight'
import { SatelliteFlightMap } from './SatelliteFlightMap'

export function GpsCockpitView({
  mission,
  drone,
  controlStatus,
  isOnline,
  statusMessage,
  busy,
  canFly,
  canTerminate,
  preflightReady,
  normalFlightAllowed,
  referenceBusy,
  finishingFlight,
  telemetryBattery,
  cameraTelemetry,
  onCommand,
  onReview,
  onFinishFlight,
  onReferenceCapture,
  onPreflightReady,
}: {
  mission: Mission
  drone: Drone
  controlStatus: ControlStatus | null
  isOnline: boolean
  statusMessage: string
  busy: boolean
  canFly: boolean
  canTerminate: boolean
  preflightReady: boolean
  normalFlightAllowed: boolean
  referenceBusy: boolean
  finishingFlight: boolean
  telemetryBattery: number | null
  cameraTelemetry: DroneCameraTelemetry | null
  onCommand: (command: FlightCommand) => void
  onReview: () => void
  onFinishFlight: () => void
  onReferenceCapture: () => void | Promise<void>
  onPreflightReady: () => void | Promise<void>
}) {
  const { t, lang } = useI18n(gpsCockpitViewMessages)
  const target =
    Number.isFinite(mission.lat) && Number.isFinite(mission.lng)
      ? { latitude: mission.lat, longitude: mission.lng }
      : null
  const gpsTargetReady = Boolean(target && isInsideHcmcServiceArea(target))
  const droneGps = controlStatus?.positionGps ?? null
  const altitudeM =
    droneGps?.relativeAltitudeM ?? controlStatus?.altitudeM ?? null
  const verticalMps =
    controlStatus?.velocityNed?.downMps == null
      ? null
      : -controlStatus.velocityNed.downMps
  const baseDistanceKm = controlStatus?.positionNed
    ? Math.hypot(
        controlStatus.positionNed.northM,
        controlStatus.positionNed.eastM,
      ) / 1000
    : null
  const targetDistanceKm =
    droneGps && target ? gpsDistanceMeters(droneGps, target) / 1000 : null
  const language = lang === 'en' ? 'en' : 'vi'
  return (
    <FlightCockpit
      language={language}
      missionLabel={mission.id}
      roleLabel={t.droneOperator}
      liveLabel={isOnline ? t.live : t.offline}
      online={isOnline}
      waitingGpsLabel={t.waitingGps}
      statusMessage={statusMessage}
      telemetry={{
        latitude: droneGps?.latitude ?? null,
        longitude: droneGps?.longitude ?? null,
        altitudeM,
        speedMps: controlStatus?.speedMps ?? null,
        verticalMps,
        headingDeg: controlStatus?.yawDeg ?? null,
        batteryPercent: telemetryBattery,
        inAir: Boolean(controlStatus?.inAir),
        flightMode: controlStatus?.batteryDrainMode ?? null,
        baseDistanceKm,
        targetDistanceKm,
      }}
      camera={
        <DroneCameraView telemetry={cameraTelemetry} language={language} />
      }
      map={
        <SatelliteFlightMap
          missionId={mission.backendId ?? mission.id}
          target={target}
          drone={droneGps}
        />
      }
      busy={busy}
      canFly={canFly}
      canTerminate={canTerminate}
      canFlyToTarget={gpsTargetReady}
      referenceBusy={referenceBusy}
      onCommand={onCommand}
      onReview={onReview}
      onFinishFlight={onFinishFlight}
      finishingFlight={finishingFlight}
      onReferenceCapture={() => void onReferenceCapture()}
      overlay={
        !preflightReady && normalFlightAllowed ? (
          <div className="satellite-flight-preflight">
            <ManualCockpitPreflight
              missionLabel={mission.id}
              deviceLabel={drone.name || drone.id}
              onReady={onPreflightReady}
            />
          </div>
        ) : null
      }
    />
  )
}
