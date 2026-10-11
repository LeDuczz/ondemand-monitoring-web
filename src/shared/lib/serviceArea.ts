export type GpsPoint = {
  latitude: number
  longitude: number
}

export const HCMC_SERVICE_CENTER: GpsPoint = {
  latitude: Number(import.meta.env.VITE_HCMC_HOME_LAT ?? 10.7769),
  longitude: Number(import.meta.env.VITE_HCMC_HOME_LON ?? 106.7009),
}

export const HCMC_SERVICE_POLYGON: GpsPoint[] = [
  { latitude: 10.3700, longitude: 106.3600 },
  { latitude: 10.5200, longitude: 106.2000 },
  { latitude: 10.8800, longitude: 106.2700 },
  { latitude: 11.1700, longitude: 106.5000 },
  { latitude: 11.1600, longitude: 106.9000 },
  { latitude: 10.9700, longitude: 107.1500 },
  { latitude: 10.5900, longitude: 107.1000 },
  { latitude: 10.3400, longitude: 106.9000 },
]

export function isValidGps(point: GpsPoint) {
  return Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180
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
    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi
    if (intersects) inside = !inside
  }

  return inside
}

export function isInsideHcmcServiceArea(point: GpsPoint) {
  return isPointInPolygon(point, HCMC_SERVICE_POLYGON)
}

export function hcmcServicePolygonLatLngs() {
  return HCMC_SERVICE_POLYGON.map((point) => [point.latitude, point.longitude] as [number, number])
}
