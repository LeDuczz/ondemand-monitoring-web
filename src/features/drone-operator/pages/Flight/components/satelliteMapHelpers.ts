import type { GpsPoint } from '../gpsRoutePlanner'

export type GpsPosition = {
  latitude: number
  longitude: number
  relativeAltitudeM?: number
}

export function sameGpsPoint(from: GpsPoint, to: GpsPoint) {
  return from.latitude === to.latitude && from.longitude === to.longitude
}

export function lerpGpsPoint(
  from: GpsPoint,
  to: GpsPoint,
  progress: number,
): GpsPoint {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * progress,
    longitude: from.longitude + (to.longitude - from.longitude) * progress,
  }
}
