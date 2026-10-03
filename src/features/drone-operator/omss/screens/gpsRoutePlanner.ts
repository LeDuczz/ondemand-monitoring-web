export type GpsPoint = {
  latitude: number
  longitude: number
}

export type RestrictedGpsZone = {
  id: string
  code?: string
  name?: string
  coordinates: GpsPoint[]
}

const detourPaddingDeg = 0.008
const restrictedZoneTypes = new Set(['AIRPORT', 'RESTRICTED', 'NO_FLY', 'NO-FLY', 'NOFLY'])

export const tanSonNhatNoFlyZone: RestrictedGpsZone = {
  id: 'ZONE_HCMC_TSN_NO_FLY',
  code: 'HCMC_TSN_NO_FLY',
  name: 'Vùng cấm bay sân bay Tân Sơn Nhất',
  coordinates: [
    { longitude: 106.6348, latitude: 10.8079 },
    { longitude: 106.6348, latitude: 10.8142 },
    { longitude: 106.6380, latitude: 10.8179 },
    { longitude: 106.6479, latitude: 10.8212 },
    { longitude: 106.6548, latitude: 10.8219 },
    { longitude: 106.6610, latitude: 10.8232 },
    { longitude: 106.6700, latitude: 10.8258 },
    { longitude: 106.6741, latitude: 10.8271 },
    { longitude: 106.6785, latitude: 10.8264 },
    { longitude: 106.6748, latitude: 10.8244 },
    { longitude: 106.6736, latitude: 10.8215 },
    { longitude: 106.6731, latitude: 10.8188 },
    { longitude: 106.6711, latitude: 10.8175 },
    { longitude: 106.6683, latitude: 10.8151 },
    { longitude: 106.6672, latitude: 10.8133 },
    { longitude: 106.6661, latitude: 10.8098 },
    { longitude: 106.6636, latitude: 10.8079 },
    { longitude: 106.6610, latitude: 10.8090 },
    { longitude: 106.6587, latitude: 10.8103 },
    { longitude: 106.6514, latitude: 10.8095 },
    { longitude: 106.6438, latitude: 10.8077 },
    { longitude: 106.6376, latitude: 10.8066 },
    { longitude: 106.6348, latitude: 10.8079 },
  ],
}

export function isValidGps(point: GpsPoint | null | undefined): point is GpsPoint {
  if (!point) return false
  return (
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180 &&
    (point.latitude !== 0 || point.longitude !== 0)
  )
}

export function bearingDegrees(from: GpsPoint, to: GpsPoint) {
  const fromLat = from.latitude * Math.PI / 180
  const toLat = to.latitude * Math.PI / 180
  const deltaLng = (to.longitude - from.longitude) * Math.PI / 180
  const y = Math.sin(deltaLng) * Math.cos(toLat)
  const x = Math.cos(fromLat) * Math.sin(toLat) - Math.sin(fromLat) * Math.cos(toLat) * Math.cos(deltaLng)
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360
}

export function gpsDistanceMeters(from: GpsPoint, to: GpsPoint) {
  const radiusM = 6_371_000
  const fromLat = from.latitude * Math.PI / 180
  const toLat = to.latitude * Math.PI / 180
  const deltaLat = (to.latitude - from.latitude) * Math.PI / 180
  const deltaLng = (to.longitude - from.longitude) * Math.PI / 180
  const a = Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2
  return 2 * radiusM * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function isPointInPolygon(point: GpsPoint, polygon: GpsPoint[]) {
  if (!isValidGps(point) || polygon.length < 3) return false

  const x = point.longitude
  const y = point.latitude
  let inside = false

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].longitude
    const yi = polygon[i].latitude
    const xj = polygon[j].longitude
    const yj = polygon[j].latitude
    const intersects = yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }

  return inside
}

export function isRestrictedGpsZonePayload(zone: { restricted?: boolean; zoneType?: string }) {
  const type = String(zone.zoneType ?? '').trim().toUpperCase()
  return zone.restricted === true || restrictedZoneTypes.has(type) || type.includes('RESTRICTED')
}

export function withDefaultRestrictedGpsZones(zones: RestrictedGpsZone[]) {
  const validZones = zones
    .filter((zone) => zone.coordinates.length >= 3)
    .map((zone) => (
      zone.code === tanSonNhatNoFlyZone.code || zone.id === tanSonNhatNoFlyZone.id
        ? tanSonNhatNoFlyZone
        : zone
    ))
  const hasTanSonNhat = validZones.some((zone) =>
    zone.code === tanSonNhatNoFlyZone.code || zone.id === tanSonNhatNoFlyZone.id)
  return hasTanSonNhat ? validZones : [...validZones, tanSonNhatNoFlyZone]
}

function orientation(a: GpsPoint, b: GpsPoint, c: GpsPoint) {
  const value = (b.longitude - a.longitude) * (c.latitude - a.latitude) -
    (b.latitude - a.latitude) * (c.longitude - a.longitude)
  if (Math.abs(value) < 1e-12) return 0
  return value > 0 ? 1 : -1
}

function onSegment(a: GpsPoint, b: GpsPoint, c: GpsPoint) {
  return Math.min(a.longitude, c.longitude) <= b.longitude + 1e-12 &&
    b.longitude <= Math.max(a.longitude, c.longitude) + 1e-12 &&
    Math.min(a.latitude, c.latitude) <= b.latitude + 1e-12 &&
    b.latitude <= Math.max(a.latitude, c.latitude) + 1e-12
}

function segmentsIntersect(a: GpsPoint, b: GpsPoint, c: GpsPoint, d: GpsPoint) {
  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)

  if (o1 !== o2 && o3 !== o4) return true
  if (o1 === 0 && onSegment(a, c, b)) return true
  if (o2 === 0 && onSegment(a, d, b)) return true
  if (o3 === 0 && onSegment(c, a, d)) return true
  if (o4 === 0 && onSegment(c, b, d)) return true
  return false
}

export function segmentCrossesPolygon(from: GpsPoint, to: GpsPoint, polygon: GpsPoint[]) {
  if (polygon.length < 3) return false
  if (isPointInPolygon(from, polygon) || isPointInPolygon(to, polygon)) return true

  for (let i = 0; i < polygon.length; i += 1) {
    const current = polygon[i]
    const next = polygon[(i + 1) % polygon.length]
    if (segmentsIntersect(from, to, current, next)) return true
  }
  return false
}

function routeCrossesAnyZone(route: GpsPoint[], zones: RestrictedGpsZone[]) {
  for (let i = 0; i < route.length - 1; i += 1) {
    if (zones.some((zone) => segmentCrossesPolygon(route[i], route[i + 1], zone.coordinates))) return true
  }
  return false
}

function expandedZoneVertices(zone: RestrictedGpsZone) {
  const openRing = zone.coordinates.filter((point, index, list) => {
    if (index === list.length - 1) {
      const first = list[0]
      return first.latitude !== point.latitude || first.longitude !== point.longitude
    }
    return true
  })
  const center = openRing.reduce(
    (sum, point) => ({
      latitude: sum.latitude + point.latitude / openRing.length,
      longitude: sum.longitude + point.longitude / openRing.length,
    }),
    { latitude: 0, longitude: 0 },
  )

  return openRing.map((point) => {
    const latDirection = Math.sign(point.latitude - center.latitude) || 1
    const lonDirection = Math.sign(point.longitude - center.longitude) || 1
    return {
      latitude: point.latitude + latDirection * detourPaddingDeg,
      longitude: point.longitude + lonDirection * detourPaddingDeg,
    }
  })
}

function routeLength(route: GpsPoint[]) {
  return route.slice(0, -1).reduce((sum, point, index) => sum + gpsDistanceMeters(point, route[index + 1]), 0)
}

function findDetour(from: GpsPoint, to: GpsPoint, zone: RestrictedGpsZone, zones: RestrictedGpsZone[]) {
  return expandedZoneVertices(zone)
    .map((candidate) => [from, candidate, to])
    .filter((route) => !routeCrossesAnyZone(route, zones))
    .sort((a, b) => routeLength(a) - routeLength(b))[0]?.[1] ?? null
}

export function buildAvoidanceRoute(from: GpsPoint | null, to: GpsPoint | null, zones: RestrictedGpsZone[]) {
  if (!isValidGps(from) || !isValidGps(to)) return []
  const restrictedZones = withDefaultRestrictedGpsZones(zones)
  const route = [from, to]

  for (let guard = 0; guard < 4; guard += 1) {
    let changed = false
    for (let index = 0; index < route.length - 1; index += 1) {
      const hitZone = restrictedZones.find((zone) => segmentCrossesPolygon(route[index], route[index + 1], zone.coordinates))
      if (!hitZone) continue

      const detour = findDetour(route[index], route[index + 1], hitZone, restrictedZones)
      if (!detour) continue
      route.splice(index + 1, 0, detour)
      changed = true
      break
    }
    if (!changed) break
  }

  return route
}
