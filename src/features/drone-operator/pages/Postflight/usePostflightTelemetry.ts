import { useEffect, useMemo, useState } from 'react'

import {
  flightControlApi,
  type FlightControlStatus,
} from '../../api/flightControlApi'
import {
  isUsablePostflightTelemetry,
  postflightTelemetryKey,
  readPostflightTelemetry,
} from './postflightHelpers'

/** Live controller status, falling back to the snapshot stored at landing. */
export function usePostflightTelemetry(
  effectiveMissionId: string,
  deviceId: string,
): FlightControlStatus | null {
  const [liveTelemetrySnapshot, setLiveTelemetrySnapshot] =
    useState<FlightControlStatus | null>(null)
  const storedTelemetrySnapshot = useMemo(
    () => readPostflightTelemetry(effectiveMissionId),
    [effectiveMissionId],
  )

  useEffect(() => {
    if (!effectiveMissionId || !deviceId) {
      setLiveTelemetrySnapshot(null)
      return
    }
    let cancelled = false
    flightControlApi
      .status()
      .then((status) => {
        if (cancelled) return
        if (isUsablePostflightTelemetry(status, effectiveMissionId)) {
          setLiveTelemetrySnapshot(status)
          window.sessionStorage.setItem(
            postflightTelemetryKey(effectiveMissionId),
            JSON.stringify(status),
          )
        }
      })
      .catch(() => {
        // Postflight can still be recorded manually if the controller is offline.
      })
    return () => {
      cancelled = true
    }
  }, [deviceId, effectiveMissionId])

  return liveTelemetrySnapshot ?? storedTelemetrySnapshot
}
