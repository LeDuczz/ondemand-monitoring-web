import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { customerApi, type FlightAreaAssessment } from '../../../api/customerApi'
import {
  ASSESSMENT_DEBOUNCE_MS,
  useFlightAreaAssessment,
  type FlightAreaAssessmentInput,
} from '../hooks/useFlightAreaAssessment'

function assessment(latitude: number): FlightAreaAssessment {
  return {
    location: { latitude, longitude: 106.7, radiusMeters: 300 },
    elevation: { available: true, terrainElevationMeters: 18, reference: 'AMSL' },
    restrictedZones: {
      dataAvailable: true,
      pointInsideRestrictedZone: false,
      monitoringAreaIntersectsRestrictedZone: false,
      affectedZones: [],
    },
    osmContext: {
      available: true,
      buildingCount: 0,
      towerCount: 0,
      mastCount: 0,
      powerTowerCount: 0,
      aerodromeNearby: false,
      helipadNearby: false,
      importantFeatures: [],
    },
    assessment: { level: 'FAVORABLE', findings: [], disclaimer: 'x' },
  }
}

const base: FlightAreaAssessmentInput = {
  latitude: '10.6398',
  longitude: '106.7173',
  radiusM: 300,
  altitudeM: 60,
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useFlightAreaAssessment', () => {
  it('waits for the debounce, then asks once with the typed values', async () => {
    const call = vi
      .spyOn(customerApi, 'getFlightAreaAssessment')
      .mockResolvedValue(assessment(10.6398))
    const { result } = renderHook(() => useFlightAreaAssessment(base))

    expect(result.current.status).toBe('loading')
    expect(call).not.toHaveBeenCalled()
    await act(() => vi.advanceTimersByTimeAsync(ASSESSMENT_DEBOUNCE_MS - 1))
    expect(call).not.toHaveBeenCalled()
    await act(() => vi.advanceTimersByTimeAsync(1))

    expect(call).toHaveBeenCalledTimes(1)
    expect(call.mock.calls[0][0]).toEqual({
      latitude: 10.6398,
      longitude: 106.7173,
      radiusMeters: 300,
      requestedAltitudeAgl: 60,
    })
    expect(result.current.status).toBe('ready')
    expect(result.current.data?.assessment.level).toBe('FAVORABLE')
  })

  it('does not call the API for every step of a drag, only the last position', async () => {
    const call = vi
      .spyOn(customerApi, 'getFlightAreaAssessment')
      .mockImplementation((query) => Promise.resolve(assessment(query.latitude)))
    const { result, rerender } = renderHook((input: FlightAreaAssessmentInput) => useFlightAreaAssessment(input), {
      initialProps: base,
    })

    for (const radiusM of [310, 330, 360, 400, 450]) {
      rerender({ ...base, radiusM })
      await act(() => vi.advanceTimersByTimeAsync(100))
    }
    expect(call).not.toHaveBeenCalled()
    await act(() => vi.advanceTimersByTimeAsync(ASSESSMENT_DEBOUNCE_MS))

    expect(call).toHaveBeenCalledTimes(1)
    expect(call.mock.calls[0][0].radiusMeters).toBe(450)
    expect(result.current.status).toBe('ready')
  })

  it('aborts the previous request and ignores its late answer', async () => {
    const resolvers: Array<(value: FlightAreaAssessment) => void> = []
    const signals: AbortSignal[] = []
    vi.spyOn(customerApi, 'getFlightAreaAssessment').mockImplementation(
      (_query, signal) =>
        new Promise<FlightAreaAssessment>((resolve) => {
          resolvers.push(resolve)
          if (signal) signals.push(signal)
        }),
    )
    const { result, rerender } = renderHook((input: FlightAreaAssessmentInput) => useFlightAreaAssessment(input), {
      initialProps: base,
    })
    await act(() => vi.advanceTimersByTimeAsync(ASSESSMENT_DEBOUNCE_MS))
    rerender({ ...base, latitude: '10.7' })
    expect(signals[0].aborted).toBe(true)
    await act(() => vi.advanceTimersByTimeAsync(ASSESSMENT_DEBOUNCE_MS))

    await act(async () => resolvers[0](assessment(10.6398)))
    expect(result.current.data).toBeNull()
    await act(async () => resolvers[1](assessment(10.7)))
    expect(result.current.data?.location.latitude).toBe(10.7)
  })

  it('keeps the previous result visible while the next one loads', async () => {
    vi.spyOn(customerApi, 'getFlightAreaAssessment').mockResolvedValue(assessment(10.6398))
    const { result, rerender } = renderHook((input: FlightAreaAssessmentInput) => useFlightAreaAssessment(input), {
      initialProps: base,
    })
    await act(() => vi.advanceTimersByTimeAsync(ASSESSMENT_DEBOUNCE_MS))
    expect(result.current.status).toBe('ready')

    rerender({ ...base, altitudeM: 80 })

    expect(result.current.status).toBe('loading')
    expect(result.current.data).not.toBeNull()
  })

  it('stays idle and sends nothing for an invalid point', async () => {
    const call = vi.spyOn(customerApi, 'getFlightAreaAssessment')
    for (const input of [
      { ...base, latitude: '' },
      { ...base, latitude: '95' },
      { ...base, longitude: 'abc' },
      { ...base, radiusM: 0 },
    ]) {
      const { result, unmount } = renderHook(() => useFlightAreaAssessment(input))
      await act(() => vi.advanceTimersByTimeAsync(ASSESSMENT_DEBOUNCE_MS * 2))
      expect(result.current.status).toBe('idle')
      unmount()
    }
    expect(call).not.toHaveBeenCalled()
  })

  it('omits the altitude when it is not a positive number', async () => {
    const call = vi
      .spyOn(customerApi, 'getFlightAreaAssessment')
      .mockResolvedValue(assessment(10.6398))
    renderHook(() => useFlightAreaAssessment({ ...base, altitudeM: Number.NaN }))
    await act(() => vi.advanceTimersByTimeAsync(ASSESSMENT_DEBOUNCE_MS))

    expect(call.mock.calls[0][0].requestedAltitudeAgl).toBeUndefined()
  })

  it('reports an error and can retry', async () => {
    const call = vi
      .spyOn(customerApi, 'getFlightAreaAssessment')
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(assessment(10.6398))
    const { result } = renderHook(() => useFlightAreaAssessment(base))
    await act(() => vi.advanceTimersByTimeAsync(ASSESSMENT_DEBOUNCE_MS))
    expect(result.current.status).toBe('error')

    act(() => result.current.retry())
    await act(() => vi.advanceTimersByTimeAsync(ASSESSMENT_DEBOUNCE_MS))

    expect(call).toHaveBeenCalledTimes(2)
    expect(result.current.status).toBe('ready')
  })
})
