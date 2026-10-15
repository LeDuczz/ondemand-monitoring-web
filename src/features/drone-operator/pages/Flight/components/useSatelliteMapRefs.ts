import { useRef } from 'react'
import L from 'leaflet'
import type { RestrictedGpsZone, GpsPoint } from '../gpsRoutePlanner'

export function useSatelliteMapRefs() {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const droneMarker = useRef<L.Marker | null>(null)
  const targetMarker = useRef<L.CircleMarker | null>(null)
  const track = useRef<L.Polyline | null>(null)
  const targetLine = useRef<L.Polyline | null>(null)
  const zoneLayers = useRef<L.Polygon[]>([])
  const zones = useRef<RestrictedGpsZone[]>([])
  const trackPoints = useRef<L.LatLngExpression[]>([])
  const displayedDronePoint = useRef<GpsPoint | null>(null)
  const droneAnimationFrame = useRef<number | null>(null)
  const lastDroneUpdateAt = useRef<number | null>(null)
  const centeredOnDrone = useRef(false)
  return {
    container,
    map,
    droneMarker,
    targetMarker,
    track,
    targetLine,
    zoneLayers,
    zones,
    trackPoints,
    displayedDronePoint,
    droneAnimationFrame,
    lastDroneUpdateAt,
    centeredOnDrone,
  }
}

export type SatelliteMapRefs = ReturnType<typeof useSatelliteMapRefs>
