import { describe, expect, it } from 'vitest'

import { generateWaypoints } from './waypoints'
import { ceilingWarnings, estimatePlanDuration } from './planDuration'

describe('estimatePlanDuration', () => {
  const center = { lat: 10.6402, lon: 106.74 }
  const policy = { photoIntervalSec: 3 }

  it('sums T_video + T_photo + T_stream for capture time', () => {
    const wps = generateWaypoints({
      planType: 'POINT',
      center,
      radiusM: 10,
      altitudeM: 40,
    })
    const result = estimatePlanDuration(
      wps,
      10,
      [
        { mediaType: 'VIDEO', durationSec: 240 },
        { mediaType: 'PHOTO', quantity: 30 },
      ],
      policy,
    )
    // T_photo = 30 * 3 = 90; T_capture = 240 + 90 = 330
    expect(result.tVideoSec).toBe(240)
    expect(result.tPhotoSec).toBe(90)
    expect(result.tCaptureSec).toBe(330)
    expect(result.estimatedDurationSec).toBeGreaterThanOrEqual(330)
  })

  it('path length is 0 for a single-waypoint list', () => {
    const result = estimatePlanDuration([], 10, [], policy)
    expect(result.pathLengthM).toBe(0)
    expect(result.tPathSec).toBe(0)
  })

  it('is pure: same input produces identical output', () => {
    const wps = generateWaypoints({
      planType: 'ORBIT',
      center,
      radiusM: 300,
      altitudeM: 60,
    })
    const reqs: Parameters<typeof estimatePlanDuration>[2] = [
      { mediaType: 'VIDEO', durationSec: 240 },
    ]
    expect(estimatePlanDuration(wps, 12, reqs, policy)).toEqual(
      estimatePlanDuration(wps, 12, reqs, policy),
    )
  })
})

describe('ceilingWarnings', () => {
  it('returns [] when altitude is within the service ceiling', () => {
    expect(ceilingWarnings(60, 100, 150)).toEqual([])
  })

  it('warns ABOVE_SERVICE_CEILING when above the service max but below no-fly', () => {
    const warnings = ceilingWarnings(120, 100, 150)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].code).toBe('ABOVE_SERVICE_CEILING')
  })

  it('warns ABOVE_NO_FLY_CEILING when above the no-fly ceiling', () => {
    const warnings = ceilingWarnings(160, 100, 150)
    expect(warnings).toHaveLength(1)
    expect(warnings[0].code).toBe('ABOVE_NO_FLY_CEILING')
  })

  it('treats the exact ceiling value as not exceeding it', () => {
    expect(ceilingWarnings(100, 100, 150)).toEqual([])
  })
})
