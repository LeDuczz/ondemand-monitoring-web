import { useCallback, useRef, useState } from 'react'
import { useI18n } from '../../../../shared/i18n'
import { missionApi } from '../../../mission/api/missionApi'
import { flightControlApi } from '../../api/flightControlApi'
import type { Drone, Mission } from '../../types/omss'
import type { ControlStatus } from './inFlightTypes'
import { referenceCaptureMessages } from './useReferenceCapture.messages'

export function useReferenceCapture({
  mission,
  drone,
  controlStatus,
  normalFlightAllowed,
  setLastCommand,
}: {
  mission: Mission
  drone: Drone
  controlStatus: ControlStatus | null
  normalFlightAllowed: boolean
  setLastCommand: (message: string) => void
}) {
  const { t } = useI18n(referenceCaptureMessages)
  const [referenceBusy, setReferenceBusy] = useState(false)
  const referenceBusyRef = useRef(false)
  const handleReferenceCapture = useCallback(async () => {
    if (!normalFlightAllowed) return
    if (referenceBusyRef.current) return
    referenceBusyRef.current = true
    setReferenceBusy(true)
    setLastCommand(t.gettingPosition)
    try {
      const missionKey = mission.backendId ?? mission.id
      // The telemetry sender only publishes GPS once the flight controller is bound to this mission.
      let justBound = false
      if (
        controlStatus?.missionId !== missionKey ||
        controlStatus?.deviceId !== drone.id
      ) {
        await flightControlApi.bindSession(missionKey, drone.id)
        justBound = true
      }
      const waitMs = (ms: number) =>
        new Promise((resolve) => window.setTimeout(resolve, ms))
      if (justBound) await waitMs(3000)
      let result: Awaited<
        ReturnType<typeof missionApi.captureReferenceImage>
      > | null = null
      for (let attempt = 0; attempt < 4 && !result; attempt += 1) {
        try {
          result = await missionApi.captureReferenceImage(missionKey)
        } catch (error) {
          const waitingForTelemetry =
            error instanceof Error && /vị trí GPS|quá cũ/i.test(error.message)
          if (!waitingForTelemetry || attempt === 3) throw error
          await waitMs(2500)
        }
      }
      if (!result) throw new Error(t.cannotCapture)
      const distance =
        result.distanceMeters == null ? null : Math.round(result.distanceMeters)
      setLastCommand(t.saved(distance))
    } catch (error) {
      setLastCommand(
        error instanceof Error && error.message
          ? error.message
          : t.cannotCapture,
      )
    } finally {
      referenceBusyRef.current = false
      setReferenceBusy(false)
    }
  }, [
    normalFlightAllowed,
    controlStatus?.missionId,
    controlStatus?.deviceId,
    drone.id,
    mission.backendId,
    mission.id,
    setLastCommand,
    t,
  ])

  return { handleReferenceCapture, referenceBusy } as const
}
