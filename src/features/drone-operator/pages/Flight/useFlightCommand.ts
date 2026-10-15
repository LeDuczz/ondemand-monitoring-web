import { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { isInsideHcmcServiceArea } from '../../../../shared/lib/serviceArea'
import { missionApi } from '../../../mission/api/missionApi'
import {
  maySendFlightCommand,
  missionHasSafeStop,
  missionMayTerminate,
} from '../../../mission/lib/missionOperationalState'
import { flightControlApi } from '../../api/flightControlApi'
import type { Drone, Mission } from '../../types/omss'
import {
  buildExecutableFlightRoute,
  type RestrictedGpsZone,
} from './gpsRoutePlanner'
import { toControllerRouteWaypoints } from './geofence'
import {
  controlBaseUrl,
  GPS_TARGET_CRUISE_SPEED_MPS,
} from './inFlightConstants'
import type { ControlStatus, FlightCommand } from './inFlightTypes'
import { captureSatelliteSnapshot } from './satelliteSnapshot'
import { flightCommandMessages } from './useFlightCommand.messages'

/** Sends flight commands to the controller and applies the auto-start / default-camera effects. */
export function useFlightCommand({
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
}: {
  mission: Mission
  drone: Drone
  controlStatus: ControlStatus | null
  restrictedGpsZones: RestrictedGpsZone[]
  normalFlightAllowed: boolean
  terminationAllowed: boolean
  operationalMessage?: string
  preflightReady: boolean
  autoStartPlan: boolean
  onRTB: () => void
  onEmergency: () => void
  onAutoStartPlanConsumed: () => void
  setLastCommand: (message: string) => void
  setIsOnline: (online: boolean) => void
}) {
  const { t } = useI18n(flightCommandMessages)
  const [busyCommand, setBusyCommand] = useState<FlightCommand | null>(null)
  const cameraDefaultAppliedRef = useRef(false)

  const sendCommand = useCallback(
    async (command: FlightCommand) => {
      if (
        !maySendFlightCommand(command, normalFlightAllowed, terminationAllowed)
      ) {
        setLastCommand(operationalMessage ?? t.noPermission)
        return
      }
      if (!preflightReady && !terminationAllowed) {
        setLastCommand(t.preflightRequired)
        return
      }
      // Recheck exact Mission before dispatch; a cockpit may stay open across a stop request.
      try {
        const id = mission.backendId ?? mission.id
        const [current, access] = await Promise.all([
          missionApi.getMissionById(id),
          missionApi.getPermissions(id),
        ])
        if (
          !maySendFlightCommand(
            command,
            !missionHasSafeStop(current) && access.canControlFlight,
            missionMayTerminate(current, access.canTerminateFlight),
          )
        ) {
          setLastCommand(t.stoppedOrNoPermission)
          return
        }
      } catch {
        setLastCommand(t.cannotConfirmPermission)
        return
      }
      const target =
        Number.isFinite(mission.lat) && Number.isFinite(mission.lng)
          ? { latitude: mission.lat, longitude: mission.lng }
          : null
      if (command === 'gps_target_start') {
        if (!target) {
          setLastCommand(t.noGpsTarget)
          return
        }
        if (!isInsideHcmcServiceArea(target)) {
          setLastCommand(t.outsideServiceArea)
          return
        }
      }
      let routeWaypoints: Array<{ latitude: number; longitude: number }> = []
      if (command === 'gps_target_start' && target) {
        const gpsRoute = buildExecutableFlightRoute(
          controlStatus?.positionGps ?? null,
          target,
          restrictedGpsZones,
        )
        routeWaypoints = toControllerRouteWaypoints(gpsRoute)
        if (routeWaypoints.length === 0) {
          setLastCommand(t.waitingGps)
          return
        }
      }
      const routePoints = (mission.routePoints ?? [])
        .slice()
        .sort((a, b) => a.sequence - b.sequence)
      if (command === 'auto_plan_start' && routePoints.length === 0) {
        setLastCommand(t.noWaypoints)
        return
      }
      setBusyCommand(command)
      try {
        const missionKey = mission.backendId ?? mission.id
        if (
          // Bind on the ground too (takeoff), so the session already belongs to this
          // mission before the drone is airborne and "Fly to point" never needs a mid-air switch.
          // Photo / video also bind on demand instead of failing when the status poll is stale.
          (command === 'gps_target_start' ||
            command === 'takeoff' ||
            command === 'photo' ||
            command === 'video_toggle') &&
          (controlStatus?.missionId !== missionKey ||
            controlStatus?.deviceId !== drone.id)
        ) {
          setLastCommand(t.binding)
          await flightControlApi.bindSession(missionKey, drone.id)
        }
        if (command === 'photo') {
          // The cockpit camera is satellite imagery, so capture exactly that view in the browser
          // and hand it to the controller's local media library for review/upload.
          const gps = controlStatus?.positionGps
          if (gps) {
            const altitudeForView =
              gps.relativeAltitudeM ?? controlStatus?.altitudeM ?? null
            const stamp = new Date()
            const blob = await captureSatelliteSnapshot({
              latitude: gps.latitude,
              longitude: gps.longitude,
              heading: controlStatus?.yawDeg ?? null,
              altitudeM: altitudeForView,
              caption: `${gps.latitude.toFixed(5)}, ${gps.longitude.toFixed(5)}  ALT ${altitudeForView === null ? '--' : Math.round(altitudeForView)}m  ${stamp.toLocaleTimeString()}`,
            })
            const upload = await fetch(
              `${controlBaseUrl}/api/media/local/capture`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'image/jpeg',
                  'X-Media-Source-Type': 'SATELLITE_SNAPSHOT',
                },
                body: blob,
              },
            )
            if (!upload.ok) {
              const payload = (await upload.json().catch(() => null)) as {
                error?: string
              } | null
              throw new Error(payload?.error ?? `HTTP ${upload.status}`)
            }
            setLastCommand(t.photoSaved)
            setIsOnline(true)
            return
          }
        }
        const currentAltitudeM =
          controlStatus?.positionGps?.relativeAltitudeM ??
          controlStatus?.altitudeM
        const targetAltitudeM =
          typeof currentAltitudeM === 'number' &&
          Number.isFinite(currentAltitudeM)
            ? Math.max(8, Math.min(50, currentAltitudeM))
            : 25
        const response = await fetch(`${controlBaseUrl}/api/control/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command,
            ...(command === 'auto_plan_start'
              ? {
                  missionId: missionKey,
                  waypoints: routePoints.map((point) => ({
                    sequence: point.sequence,
                    simX: point.simX,
                    simY: point.simY,
                    altitudeM: point.altitudeM,
                    speedMps: point.speedMps,
                    reason: point.reason,
                  })),
                }
              : {}),
            ...(command === 'gps_target_start' && target
              ? {
                  missionId: missionKey,
                  latitude: target.latitude,
                  longitude: target.longitude,
                  relativeAltitudeM: targetAltitudeM,
                  speedMps: GPS_TARGET_CRUISE_SPEED_MPS,
                  routeWaypoints: routeWaypoints.map((point, index) => ({
                    sequence: index,
                    latitude: point.latitude,
                    longitude: point.longitude,
                    relativeAltitudeM: targetAltitudeM,
                  })),
                }
              : {}),
          }),
        })

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as {
            error?: string
          } | null
          throw new Error(payload?.error ?? `HTTP ${response.status}`)
        }
        setLastCommand(
          command === 'auto_plan_start'
            ? t.autoPlanStarted(routePoints.length)
            : command === 'gps_target_start'
              ? t.gpsTargetStarted
              : command === 'camera_front'
                ? t.cameraReset
                : t.commandSent(command.replaceAll('_', ' ')),
        )
        setIsOnline(true)

        if (command === 'return_to_base') onRTB()
        if (command === 'emergency_stop') onEmergency()
      } catch (cause) {
        setLastCommand(
          cause instanceof TypeError
            ? t.controllerOffline
            : cause instanceof Error
              ? cause.message
              : t.controllerOffline,
        )
        if (cause instanceof TypeError) setIsOnline(false)
      } finally {
        setBusyCommand(null)
      }
    },
    [
      controlStatus?.deviceId,
      controlStatus?.altitudeM,
      controlStatus?.missionId,
      controlStatus?.positionGps,
      drone.id,
      mission.backendId,
      mission.id,
      mission.lat,
      mission.lng,
      mission.routePoints,
      onEmergency,
      onRTB,
      normalFlightAllowed,
      terminationAllowed,
      operationalMessage,
      preflightReady,
      restrictedGpsZones,
      t,
    ],
  )

  useEffect(() => {
    if (!preflightReady || cameraDefaultAppliedRef.current) return
    cameraDefaultAppliedRef.current = true
    void sendCommand('camera_front')
  }, [preflightReady, sendCommand])

  useEffect(() => {
    if (!autoStartPlan) return
    if (import.meta.env.VITE_FLIGHT_MAP_ONLY !== 'false') {
      setLastCommand(t.legacyWaypointsUnavailable)
      onAutoStartPlanConsumed()
      return
    }
    if (!preflightReady) return
    if ((mission.routePoints?.length ?? 0) === 0) {
      setLastCommand(t.noWaypoints)
      onAutoStartPlanConsumed()
      return
    }
    onAutoStartPlanConsumed()
    void sendCommand('auto_plan_start')
  }, [
    autoStartPlan,
    mission.routePoints,
    onAutoStartPlanConsumed,
    preflightReady,
    sendCommand,
    t,
  ])

  return { sendCommand, busyCommand } as const
}
