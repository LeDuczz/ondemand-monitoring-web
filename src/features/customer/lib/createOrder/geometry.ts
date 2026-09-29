import {
  SIMULATION_MAP_DEFAULT_CROP,
  worldToViewportPercent,
} from '../../../../shared/lib/simulationMapProjection'
import { clamp } from './format'
import type { SimulationMapMeta, SimulationZone, ZonePayload } from './types'

export const MAP_IMAGE_CROP = SIMULATION_MAP_DEFAULT_CROP
/** Metres of order radius represented by one pixel on the simulation map. */
export const SIM_RADIUS_SCALE = 6
export const RESTRICTED_ZONE_CONTACT_TOLERANCE_PX = 8

type Point = [number, number]

/** Closes the ring and drops invalid points; returns [] when < 3 usable points. */
export function normalizeRing(coordinates: number[][] | undefined): Point[] {
  if (!coordinates) return []
  const ring = coordinates
    .map((point) => [Number(point[0]), Number(point[1])] as Point)
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))

  if (ring.length < 3) return []
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first)
  return ring
}

function pointOnSegment(p: Point, a: Point, b: Point) {
  const cross = (p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0])
  if (Math.abs(cross) > 1e-9) return false
  return (p[0] - a[0]) * (p[0] - b[0]) + (p[1] - a[1]) * (p[1] - b[1]) <= 1e-9
}

export function polygonContainsPoint(ring: Point[], point: Point) {
  const [px, py] = point
  let inside = false

  for (let index = 0; index < ring.length - 1; index += 1) {
    const a = ring[index]
    const b = ring[index + 1]
    if (pointOnSegment(point, a, b)) return true
    if (a[1] > py !== b[1] > py) {
      const xAtY = a[0] + ((py - a[1]) * (b[0] - a[0])) / (b[1] - a[1])
      if (px < xAtY) inside = !inside
    }
  }

  return inside
}

export function findContainingZone(point: Point, zones: SimulationZone[]) {
  return zones.find((zone) => polygonContainsPoint(zone.coordinates, point))
}

function distance(a: Point, b: Point) {
  return Math.hypot(a[0] - b[0], a[1] - b[1])
}

function distancePointToSegment(point: Point, start: Point, end: Point) {
  const dx = end[0] - start[0]
  const dy = end[1] - start[1]
  if (dx === 0 && dy === 0) return distance(point, start)

  const t = clamp(
    ((point[0] - start[0]) * dx + (point[1] - start[1]) * dy) /
      (dx * dx + dy * dy),
    0,
    1,
  )
  return distance(point, [start[0] + t * dx, start[1] + t * dy])
}

function circleIntersectsPolygon(center: Point, radius: number, ring: Point[]) {
  const effectiveRadius = Math.max(
    0,
    radius - RESTRICTED_ZONE_CONTACT_TOLERANCE_PX,
  )
  if (polygonContainsPoint(ring, center)) return true
  if (ring.some((point) => distance(center, point) <= effectiveRadius)) {
    return true
  }
  for (let index = 0; index < ring.length - 1; index += 1) {
    if (
      distancePointToSegment(center, ring[index], ring[index + 1]) <=
      effectiveRadius
    ) {
      return true
    }
  }
  return false
}

export type RestrictedValidation = {
  valid: boolean
  blockedZones: SimulationZone[]
}

export function validateRestrictedZones(
  center: Point,
  radiusM: number,
  zones: SimulationZone[],
): RestrictedValidation {
  const simulationRadius = radiusM / SIM_RADIUS_SCALE
  const blockedZones = zones
    .filter((zone) => zone.restricted)
    .filter((zone) =>
      circleIntersectsPolygon(center, simulationRadius, zone.coordinates),
    )
  return { valid: blockedZones.length === 0, blockedZones }
}

export type MonitoringValidation = {
  valid: boolean
  zone: SimulationZone | undefined
  /** False when no monitoring zone is configured (nothing to check against). */
  checked: boolean
}

export function validateMonitoringZone(
  center: Point,
  zones: SimulationZone[],
): MonitoringValidation {
  const monitoringZones = zones.filter((zone) => !zone.restricted)
  if (monitoringZones.length === 0) {
    return { valid: true, zone: undefined, checked: false }
  }
  const zone = monitoringZones.find((item) =>
    polygonContainsPoint(item.coordinates, center),
  )
  return { valid: Boolean(zone), zone, checked: true }
}

export function simPointToPercent(point: Point, meta: SimulationMapMeta) {
  return worldToViewportPercent(
    { simX: point[0], simY: point[1] },
    meta,
    MAP_IMAGE_CROP,
  )
}

/** Maps raw `GET /api/zones` items to closed-ring zones, dropping degenerate ones. */
export function normalizeZones(items: ZonePayload[]): SimulationZone[] {
  return items
    .map((zone) => ({
      id: String(zone.id ?? zone.code ?? zone.name ?? 'zone'),
      code: String(zone.code ?? ''),
      name: String(zone.name ?? zone.code ?? 'Monitoring zone'),
      zoneType: String(zone.zoneType ?? ''),
      restricted: Boolean(zone.restricted),
      coordinates: normalizeRing(zone.coordinates),
    }))
    .filter((zone) => zone.coordinates.length >= 4)
}
