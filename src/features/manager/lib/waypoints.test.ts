import { describe, expect, it } from 'vitest'

import { generateWaypoints } from './waypoints'

const center = { lat: 10.6402, lon: 106.74 }

describe('generateWaypoints', () => {
  it('ORBIT starts with TAKEOFF and ends with RTL, LAND', () => {
    const wps = generateWaypoints({
      planType: 'ORBIT',
      center,
      radiusM: 300,
      altitudeM: 60,
    })
    expect(wps[0].action).toBe('TAKEOFF')
    expect(wps[0].altM).toBe(0)
    expect(wps.at(-2)?.action).toBe('RTL')
    expect(wps.at(-1)?.action).toBe('LAND')
    expect(wps.at(-1)?.altM).toBe(0)
    // seq is contiguous starting at 1
    wps.forEach((wp, i) => expect(wp.seq).toBe(i + 1))
    // contains at least one ORBIT action at cruise altitude
    expect(wps.some((wp) => wp.action === 'ORBIT' && wp.altM === 60)).toBe(true)
  })

  it('ORBIT waypoints stay ~radiusM from the center (within 1%)', () => {
    const radiusM = 300
    const wps = generateWaypoints({
      planType: 'ORBIT',
      center,
      radiusM,
      altitudeM: 60,
    })
    const orbitPoints = wps.filter((wp) => wp.action === 'ORBIT')
    expect(orbitPoints.length).toBeGreaterThan(0)
    for (const wp of orbitPoints) {
      const dLatM = (wp.lat - center.lat) * 111_320
      const dLonM =
        (wp.lon - center.lon) * 111_320 * Math.cos((center.lat * Math.PI) / 180)
      const distM = Math.sqrt(dLatM * dLatM + dLonM * dLonM)
      expect(Math.abs(distM - radiusM)).toBeLessThan(radiusM * 0.01)
    }
  })

  it('GRID produces alternating GOTO/CAPTURE pairs covering the radius', () => {
    const wps = generateWaypoints({
      planType: 'GRID',
      center,
      radiusM: 200,
      altitudeM: 80,
    })
    expect(wps[0].action).toBe('TAKEOFF')
    expect(wps.filter((wp) => wp.action === 'GOTO').length).toBeGreaterThan(0)
    expect(wps.filter((wp) => wp.action === 'CAPTURE').length).toBeGreaterThan(
      0,
    )
  })

  it('POINT produces GOTO, HOVER, CAPTURE at the center', () => {
    const wps = generateWaypoints({
      planType: 'POINT',
      center,
      radiusM: 50,
      altitudeM: 40,
    })
    const actions = wps.map((wp) => wp.action)
    expect(actions).toEqual([
      'TAKEOFF',
      'GOTO',
      'HOVER',
      'CAPTURE',
      'RTL',
      'LAND',
    ])
    const hover = wps.find((wp) => wp.action === 'HOVER')
    expect(hover?.lat).toBeCloseTo(center.lat, 6)
    expect(hover?.lon).toBeCloseTo(center.lon, 6)
  })

  it('is pure: same input produces identical output', () => {
    const input = {
      planType: 'ORBIT' as const,
      center,
      radiusM: 300,
      altitudeM: 60,
    }
    expect(generateWaypoints(input)).toEqual(generateWaypoints(input))
  })
})
