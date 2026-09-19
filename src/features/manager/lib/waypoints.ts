// PROPOSED: FE preview only. Backend generates the authoritative flight
// plan (`flight_plan`/`flight_waypoint` [BRIEF A6]); this module produces a
// deterministic waypoint list purely so CreateMissionPage (MNG-04) can draw
// a live SVG preview and prefill the editable waypoint table before submit.
// Action enum values come from [BRIEF A6] `flight_waypoint.action`:
// TAKEOFF / GOTO / HOVER / CAPTURE / ORBIT / RTL / LAND.
import type { GeoPoint } from '../../../shared/lib/flightTime'
import type { PlanType } from '../../../shared/lib/flightTime'

export type WaypointAction =
  'TAKEOFF' | 'GOTO' | 'HOVER' | 'CAPTURE' | 'ORBIT' | 'RTL' | 'LAND'

export type Waypoint = {
  seq: number
  action: WaypointAction
  lat: number
  lon: number
  altM: number
}

export type GenerateWaypointsInput = {
  planType: PlanType
  center: GeoPoint
  /** Metres; required for ORBIT and used as the GRID/POINT survey extent. */
  radiusM: number
  altitudeM: number
}

const EARTH_RADIUS_M = 6_371_000

/** Offsets `origin` by `dNorthM`/`dEastM` metres, returning a new point. */
function offset(origin: GeoPoint, dNorthM: number, dEastM: number): GeoPoint {
  const dLat = (dNorthM / EARTH_RADIUS_M) * (180 / Math.PI)
  const dLon =
    ((dEastM / EARTH_RADIUS_M) * (180 / Math.PI)) /
    Math.cos((origin.lat * Math.PI) / 180)
  return { lat: origin.lat + dLat, lon: origin.lon + dLon }
}

/**
 * Generates a TAKEOFF → … → RTL → LAND waypoint sequence for a preview
 * flight plan. Pure function — same input always produces the same output.
 */
export function generateWaypoints(input: GenerateWaypointsInput): Waypoint[] {
  const { planType, center, radiusM, altitudeM } = input
  const waypoints: Waypoint[] = []
  let seq = 1
  const push = (action: WaypointAction, point: GeoPoint, altM: number) => {
    waypoints.push({ seq: seq++, action, lat: point.lat, lon: point.lon, altM })
  }

  push('TAKEOFF', center, 0)

  if (planType === 'ORBIT') {
    const steps = 8
    const start = offset(center, radiusM, 0)
    push('GOTO', start, altitudeM)
    for (let i = 1; i <= steps; i++) {
      const angle = (2 * Math.PI * i) / steps
      const point = offset(
        center,
        radiusM * Math.cos(angle),
        radiusM * Math.sin(angle),
      )
      push('ORBIT', point, altitudeM)
    }
    push('CAPTURE', center, altitudeM)
  } else if (planType === 'GRID') {
    const lines = 4
    for (let i = 0; i <= lines; i++) {
      const north = -radiusM + (2 * radiusM * i) / lines
      const eastEnd = i % 2 === 0 ? radiusM : -radiusM
      const eastStart = i % 2 === 0 ? -radiusM : radiusM
      push('GOTO', offset(center, north, eastStart), altitudeM)
      push('CAPTURE', offset(center, north, eastEnd), altitudeM)
    }
  } else {
    // POINT
    push('GOTO', center, altitudeM)
    push('HOVER', center, altitudeM)
    push('CAPTURE', center, altitudeM)
  }

  push('RTL', center, altitudeM)
  push('LAND', center, 0)

  return waypoints
}
