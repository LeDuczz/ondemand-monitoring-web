import { isValidGps, type GpsPoint } from '../../../../shared/lib/serviceArea'

export type PermitZone = {
  code: string
  name: string
  nameEn: string
  latitude: number
  longitude: number
  radiusM: number
}

/**
 * Real-world airspace areas where a drone flight needs a permit.
 * Mirrors `AirspacePolicy.java` on the backend; keep both lists in sync.
 */
export const PERMIT_ZONES: PermitZone[] = [
  {
    code: 'TAN_SON_NHAT',
    name: 'Sân bay Tân Sơn Nhất',
    nameEn: 'Tan Son Nhat Airport',
    latitude: 10.8188,
    longitude: 106.652,
    radiusM: 3000,
  },
]

const EARTH_RADIUS_M = 6_371_000

/** Great-circle distance in metres. */
export function distanceM(a: GpsPoint, b: GpsPoint) {
  const rad = (deg: number) => (deg * Math.PI) / 180
  const dLat = rad(b.latitude - a.latitude)
  const dLon = rad(b.longitude - a.longitude)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** First permit zone touched by the monitoring circle (point + radius), or null. */
export function findPermitZone(point: GpsPoint, radiusM = 0): PermitZone | null {
  if (!isValidGps(point)) return null
  return (
    PERMIT_ZONES.find(
      (zone) => distanceM(zone, point) - Math.max(0, radiusM) <= zone.radiusM,
    ) ?? null
  )
}
