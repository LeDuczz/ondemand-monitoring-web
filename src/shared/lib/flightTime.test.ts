import { describe, expect, it } from 'vitest'

import { estimateFlightTime, haversineDistanceM } from './flightTime'

describe('haversineDistanceM', () => {
  it('returns 0 for identical points', () => {
    expect(
      haversineDistanceM(
        { lat: 10.77, lon: 106.7 },
        { lat: 10.77, lon: 106.7 },
      ),
    ).toBe(0)
  })

  it('matches the well-known distance between two reference points', () => {
    // Hanoi (21.0278, 105.8342) to Ho Chi Minh City (10.7769, 106.7009):
    // widely published great-circle distance is ~1137-1160 km depending on
    // the exact coordinates used; assert a tolerant range around it.
    const d = haversineDistanceM(
      { lat: 21.0278, lon: 105.8342 },
      { lat: 10.7769, lon: 106.7009 },
    )
    expect(d).toBeGreaterThan(1_120_000)
    expect(d).toBeLessThan(1_160_000)
  })
})

describe('estimateFlightTime', () => {
  it('computes every intermediate value by hand for a POINT plan', () => {
    // base = center (distance 0m) so T_travel = 0, isolating the capture math.
    // cruiseSpeedMs = 10, planType POINT so T_orbit = 0.
    // T_video = 60s, photoQuantity = 4 × photoIntervalSec 5s = 20s → T_photo = 20s
    // T_stream = 30s
    // T_capture = max(T_orbit=0, T_video+T_photo+T_stream = 60+20+30=110) = 110
    // T_required = T_travel(0) + T_capture(110) = 110
    // maxFlightTimeMin = 25 → 25*60 = 1500s; buffer 20% → T_limit = 1500*0.8 = 1200
    // feasible: 110 <= 1200 → true
    // enduranceMargin = 1 - 110/1200 = 1 - 0.091666... = 0.908333...
    const result = estimateFlightTime({
      base: { lat: 10, lon: 106 },
      center: { lat: 10, lon: 106 },
      planType: 'POINT',
      cruiseSpeedMs: 10,
      videoDurationSec: 60,
      photoQuantity: 4,
      photoIntervalSec: 5,
      streamDurationSec: 30,
      maxFlightTimeMin: 25,
      flightTimeBufferPct: 20,
    })

    expect(result.distanceM).toBe(0)
    expect(result.tTravelSec).toBe(0)
    expect(result.tOrbitSec).toBe(0)
    expect(result.tVideoSec).toBe(60)
    expect(result.tPhotoSec).toBe(20)
    expect(result.tStreamSec).toBe(30)
    expect(result.tCaptureSec).toBe(110)
    expect(result.tRequiredSec).toBe(110)
    expect(result.tLimitSec).toBe(1200)
    expect(result.feasible).toBe(true)
    expect(result.enduranceMargin).toBeCloseTo(0.9083333, 6)
  })

  it('uses T_orbit when it is the largest capture component (ORBIT plan)', () => {
    // radiusM = 200, cruiseSpeedMs = 8 → T_orbit = 2π×200/8 = 400π/8 = 50π ≈ 157.0796s
    // T_video+T_photo+T_stream = 10+0+0 = 10s, much smaller than T_orbit.
    // T_capture = max(157.0796, 10) = 157.0796
    const result = estimateFlightTime({
      base: { lat: 10, lon: 106 },
      center: { lat: 10, lon: 106 },
      planType: 'ORBIT',
      radiusM: 200,
      cruiseSpeedMs: 8,
      videoDurationSec: 10,
      photoQuantity: 0,
      photoIntervalSec: 5,
      streamDurationSec: 0,
      maxFlightTimeMin: 20,
      flightTimeBufferPct: 0,
    })

    expect(result.tOrbitSec).toBeCloseTo(50 * Math.PI, 6)
    expect(result.tCaptureSec).toBeCloseTo(50 * Math.PI, 6)
  })

  it('marks a mission infeasible when T_required exceeds T_limit', () => {
    // base -> center distance ~ nonzero, huge video duration to blow the budget.
    const result = estimateFlightTime({
      base: { lat: 10.0, lon: 106.0 },
      center: { lat: 10.05, lon: 106.05 },
      planType: 'POINT',
      cruiseSpeedMs: 12,
      videoDurationSec: 5000,
      photoQuantity: 0,
      photoIntervalSec: 5,
      streamDurationSec: 0,
      maxFlightTimeMin: 25,
      flightTimeBufferPct: 20,
    })

    expect(result.feasible).toBe(false)
    expect(result.enduranceMargin).toBeLessThan(0)
  })

  it('ignores radiusM/T_orbit for a non-ORBIT plan', () => {
    const result = estimateFlightTime({
      base: { lat: 10, lon: 106 },
      center: { lat: 10, lon: 106 },
      planType: 'GRID',
      radiusM: 999,
      cruiseSpeedMs: 10,
      videoDurationSec: 5,
      photoQuantity: 0,
      photoIntervalSec: 5,
      streamDurationSec: 0,
      maxFlightTimeMin: 20,
      flightTimeBufferPct: 0,
    })

    expect(result.tOrbitSec).toBe(0)
    expect(result.tCaptureSec).toBe(5)
  })
})
