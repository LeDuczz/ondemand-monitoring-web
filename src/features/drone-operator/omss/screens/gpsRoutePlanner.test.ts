import { describe, expect, it } from 'vitest'

import {
  buildAvoidanceRoute,
  segmentCrossesPolygon,
  tanSonNhatNoFlyZone,
} from './gpsRoutePlanner'

describe('gpsRoutePlanner', () => {
  it('routes around the Tan Son Nhat no-fly zone instead of crossing it', () => {
    const drone = { latitude: 10.774369, longitude: 106.7009 }
    const target = { latitude: 10.8280877, longitude: 106.616931 }

    const route = buildAvoidanceRoute(drone, target, [])

    expect(route.length).toBeGreaterThan(2)
    for (let index = 0; index < route.length - 1; index += 1) {
      expect(segmentCrossesPolygon(route[index], route[index + 1], tanSonNhatNoFlyZone.coordinates)).toBe(false)
    }
  })
})
