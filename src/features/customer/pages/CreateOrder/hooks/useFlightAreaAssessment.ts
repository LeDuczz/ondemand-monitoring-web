import { useEffect, useState } from 'react'

import {
  customerApi,
  type FlightAreaAssessment,
} from '../../../api/customerApi'

export type FlightAreaAssessmentInput = {
  latitude: string
  longitude: string
  radiusM: number
  altitudeM: number
}

export type FlightAreaAssessmentState = {
  /** `idle` = the picked point is not valid yet, nothing is requested. */
  status: 'idle' | 'loading' | 'ready' | 'error'
  /** Kept while the next result loads so the card does not flicker while the map is dragged. */
  data: FlightAreaAssessment | null
  retry: () => void
}

export const ASSESSMENT_DEBOUNCE_MS = 500

function parseCoordinate(text: string, limit: number): number | null {
  if (!text.trim()) return null
  const value = Number(text)
  return Number.isFinite(value) && Math.abs(value) <= limit ? value : null
}

/**
 * Loads the aggregate flight-area assessment for the picked point. Requests are debounced, an older
 * request is aborted when the input changes, and a late answer for old input is ignored, so dragging
 * the marker or the radius slider never floods the backend nor shows a stale result.
 */
export function useFlightAreaAssessment(
  input: FlightAreaAssessmentInput,
  debounceMs: number = ASSESSMENT_DEBOUNCE_MS,
): FlightAreaAssessmentState {
  const [data, setData] = useState<FlightAreaAssessment | null>(null)
  const [status, setStatus] = useState<FlightAreaAssessmentState['status']>('idle')
  const [attempt, setAttempt] = useState(0)

  const latitude = parseCoordinate(input.latitude, 90)
  const longitude = parseCoordinate(input.longitude, 180)
  const radius = Number.isFinite(input.radiusM) && input.radiusM > 0 ? input.radiusM : null
  const altitude =
    Number.isFinite(input.altitudeM) && input.altitudeM > 0 ? input.altitudeM : undefined

  useEffect(() => {
    if (latitude === null || longitude === null || radius === null) {
      setStatus('idle')
      return
    }
    const controller = new AbortController()
    setStatus('loading')
    const timer = window.setTimeout(() => {
      customerApi
        .getFlightAreaAssessment(
          {
            latitude,
            longitude,
            radiusMeters: radius,
            requestedAltitudeAgl: altitude,
          },
          controller.signal,
        )
        .then((result) => {
          if (controller.signal.aborted) return
          setData(result)
          setStatus('ready')
        })
        .catch(() => {
          if (controller.signal.aborted) return
          setStatus('error')
        })
    }, debounceMs)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [latitude, longitude, radius, altitude, debounceMs, attempt])

  return { status, data, retry: () => setAttempt((value) => value + 1) }
}
