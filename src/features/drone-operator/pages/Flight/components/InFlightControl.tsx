import { useCallback, useEffect, useMemo, useState } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import type { Drone, Mission } from '../../../types/omss'
import { controlBaseUrl } from '../inFlightConstants'
import type { FlightCommand } from '../inFlightTypes'
import { useControlStatus } from '../useControlStatus'
import { useFlightCommand } from '../useFlightCommand'
import { useFlightTelemetry } from '../useFlightTelemetry'
import { useGeofence } from '../useGeofence'
import { useMissionActions } from '../useMissionActions'
import { usePreflightReady } from '../usePreflightReady'
import { useReferenceCapture } from '../useReferenceCapture'
import { useRestrictedGpsZones } from '../useRestrictedZones'
import { GpsCockpitView } from './GpsCockpitView'
import { inFlightControlMessages } from './InFlightControl.messages'
import { MissionControlDashboard } from './MissionControlDashboard'
import './SatelliteFlightMap.css'

interface Props {
  normalFlightAllowed?: boolean
  terminationAllowed?: boolean
  operationalMessage?: string
  mission: Mission
  drone: Drone
  onRTB: () => void
  onEmergency: () => void
  autoStartPlan: boolean
  onAutoStartPlanConsumed: () => void
  onPreflightReady?: () => Promise<void>
  onReviewMedia?: () => void
}

export default function InFlightControl({
  normalFlightAllowed = false,
  terminationAllowed = false,
  operationalMessage,
  mission,
  drone,
  onRTB,
  onEmergency,
  autoStartPlan,
  onAutoStartPlanConsumed,
  onPreflightReady,
  onReviewMedia,
}: Props) {
  const { t } = useI18n(inFlightControlMessages)
  const preflightStorageKey = `omss.droneOperator.preflightReady.${mission.id}.${drone.id}`
  const requiresBackendPreflight = Boolean(onPreflightReady)
  const [elapsed, setElapsed] = useState(5)
  const [progress, setProgress] = useState(18.2)
  const [lastCommand, setLastCommand] = useState(t.waitingController)
  const [moreOpen, setMoreOpen] = useState(false)
  const [lidarDetailsOpen, setLidarDetailsOpen] = useState(false)
  const { preflightReady, handlePreflightReady } = usePreflightReady({
    preflightStorageKey,
    requiresBackendPreflight,
    normalFlightAllowed,
    onPreflightReady,
    setLastCommand,
  })
  const restrictedGpsZones = useRestrictedGpsZones()

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1)
      setProgress((value) => Math.min(100, value + 0.04))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])
  const { controlStatus, isOnline, setIsOnline, streamRevision } =
    useControlStatus()
  const thermalEnabled = controlStatus?.thermalEnabled === true
  const streamUrl = useMemo(
    () =>
      `${controlBaseUrl}/${thermalEnabled ? 'thermal-stream.mjpg' : 'stream.mjpg'}?viewer=operator&v=${streamRevision}`,
    [streamRevision, thermalEnabled],
  )
  const remaining = Math.max(0, mission.estimatedMinutes * 60 - elapsed)
  const geofence = useGeofence(controlStatus)
  const { busyCommand, sendCommand } = useFlightCommand({
    mission,
    drone,
    controlStatus,
    restrictedGpsZones,
    normalFlightAllowed,
    terminationAllowed,
    operationalMessage,
    preflightReady,
    autoStartPlan,
    onRTB,
    onEmergency,
    onAutoStartPlanConsumed,
    setLastCommand,
    setIsOnline,
  })
  const {
    cameraTelemetry,
    telemetryBattery,
    batteryDisplay,
    batteryState,
    showBatteryWarning,
  } = useFlightTelemetry(controlStatus)
  const { handleReferenceCapture, referenceBusy } = useReferenceCapture({
    mission,
    drone,
    controlStatus,
    normalFlightAllowed,
    setLastCommand,
  })
  const {
    handleReviewMedia,
    handleFinishFlight,
    finishFlightBusy,
    handleWeatherPreset,
  } = useMissionActions({
    mission,
    drone,
    onReviewMedia,
    setLastCommand,
    setIsOnline,
  })
  const handleOnline = useCallback(() => setIsOnline(true), [setIsOnline])
  const handleOffline = useCallback(() => setIsOnline(false), [setIsOnline])
  const handleToggleMore = useCallback(() => setMoreOpen((value) => !value), [])
  const handleCommand = useCallback(
    (command: FlightCommand) => {
      if (command === 'lidar_monitor_toggle') {
        setLidarDetailsOpen((value) => !value)
        if (controlStatus?.lidar?.enabled === true) {
          setLastCommand(t.lidarToggled)
          return
        }
      }
      void sendCommand(command)
    },
    [controlStatus?.lidar?.enabled, sendCommand, t],
  )

  if (import.meta.env.VITE_FLIGHT_MAP_ONLY !== 'false') {
    return (
      <GpsCockpitView
        mission={mission}
        drone={drone}
        controlStatus={controlStatus}
        isOnline={isOnline}
        statusMessage={operationalMessage ?? lastCommand}
        busy={busyCommand !== null}
        canFly={normalFlightAllowed && preflightReady}
        canTerminate={terminationAllowed}
        preflightReady={preflightReady}
        normalFlightAllowed={normalFlightAllowed}
        referenceBusy={referenceBusy}
        finishingFlight={finishFlightBusy}
        telemetryBattery={telemetryBattery}
        cameraTelemetry={cameraTelemetry}
        onCommand={handleCommand}
        onReview={handleReviewMedia}
        onFinishFlight={handleFinishFlight}
        onReferenceCapture={handleReferenceCapture}
        onPreflightReady={handlePreflightReady}
      />
    )
  }

  return (
    <MissionControlDashboard
      mission={mission}
      drone={drone}
      controlStatus={controlStatus}
      isOnline={isOnline}
      progress={progress}
      elapsed={elapsed}
      remaining={remaining}
      streamUrl={streamUrl}
      preflightReady={preflightReady}
      normalFlightAllowed={normalFlightAllowed}
      terminationAllowed={terminationAllowed}
      busyCommand={busyCommand}
      lidarDetailsOpen={lidarDetailsOpen}
      moreOpen={moreOpen}
      finishFlightBusy={finishFlightBusy}
      referenceBusy={referenceBusy}
      statusMessage={operationalMessage ?? lastCommand}
      showBatteryWarning={showBatteryWarning}
      batteryState={batteryState}
      batteryDisplay={batteryDisplay}
      geofence={geofence}
      onOnline={handleOnline}
      onOffline={handleOffline}
      onCommand={handleCommand}
      onWeatherPreset={handleWeatherPreset}
      onToggleMore={handleToggleMore}
      onReviewMedia={handleReviewMedia}
      onFinishFlight={handleFinishFlight}
      onReferenceCapture={handleReferenceCapture}
      onPreflightReady={handlePreflightReady}
    />
  )
}
