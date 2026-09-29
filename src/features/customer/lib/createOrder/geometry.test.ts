import { describe, expect, it } from 'vitest'

import {
  findContainingZone,
  normalizeRing,
  normalizeZones,
  polygonContainsPoint,
  validateMonitoringZone,
  validateRestrictedZones,
} from './geometry'
import type { SimulationZone } from './types'

const square: [number, number][] = [
  [0, 0],
  [100, 0],
  [100, 100],
  [0, 100],
  [0, 0],
]

function zone(over: Partial<SimulationZone>): SimulationZone {
  return {
    id: 'z',
    code: 'Z',
    name: 'Zone',
    zoneType: '',
    restricted: false,
    coordinates: square,
    ...over,
  }
}

describe('normalizeRing', () => {
  it('closes an open ring and drops non-finite points', () => {
    const ring = normalizeRing([[0, 0], [10, 0], [10, 10], [Number.NaN, 1]])
    expect(ring).toHaveLength(4)
    expect(ring[0]).toEqual(ring[3])
  })

  it('returns [] for fewer than 3 points or undefined', () => {
    expect(normalizeRing([[0, 0], [1, 1]])).toEqual([])
    expect(normalizeRing(undefined)).toEqual([])
  })
})

describe('polygonContainsPoint', () => {
  it('detects inside, outside and boundary points', () => {
    expect(polygonContainsPoint(square, [50, 50])).toBe(true)
    expect(polygonContainsPoint(square, [150, 50])).toBe(false)
    expect(polygonContainsPoint(square, [0, 50])).toBe(true)
  })

  it('finds the containing zone', () => {
    const a = zone({ id: 'a' })
    const b = zone({ id: 'b', coordinates: [[200, 200], [300, 200], [300, 300], [200, 200]] })
    expect(findContainingZone([250, 220], [a, b])?.id).toBe('b')
    expect(findContainingZone([500, 500], [a, b])).toBeUndefined()
  })
})

describe('validateMonitoringZone', () => {
  it('is unchecked but valid when no monitoring zone exists', () => {
    expect(validateMonitoringZone([1, 1], [zone({ restricted: true })])).toEqual({
      valid: true,
      zone: undefined,
      checked: false,
    })
  })

  it('is invalid outside every monitoring zone', () => {
    const result = validateMonitoringZone([500, 500], [zone({})])
    expect(result.valid).toBe(false)
    expect(result.checked).toBe(true)
  })

  it('returns the matching zone', () => {
    expect(validateMonitoringZone([50, 50], [zone({ name: 'Inside' })]).zone?.name).toBe('Inside')
  })
})

describe('validateRestrictedZones', () => {
  const restricted = zone({ id: 'r', restricted: true })

  it('blocks a centre inside a restricted zone', () => {
    const result = validateRestrictedZones([50, 50], 300, [restricted])
    expect(result.valid).toBe(false)
    expect(result.blockedZones.map((z) => z.id)).toEqual(['r'])
  })

  it('allows a small radius far from the zone and ignores monitoring zones', () => {
    expect(validateRestrictedZones([500, 500], 300, [restricted]).valid).toBe(true)
    expect(validateRestrictedZones([50, 50], 300, [zone({})]).valid).toBe(true)
  })
})

describe('normalizeZones', () => {
  it('keeps closed rings with >= 4 points and fills defaults', () => {
    const zones = normalizeZones([
      { code: 'A', coordinates: [[0, 0], [1, 0], [1, 1]], restricted: true },
      { coordinates: [[0, 0], [1, 1]] },
    ])
    expect(zones).toHaveLength(1)
    expect(zones[0]).toMatchObject({ id: 'A', name: 'A', restricted: true })
  })
})
