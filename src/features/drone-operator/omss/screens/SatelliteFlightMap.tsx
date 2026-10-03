import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { env } from '../../../../config/env'
import {
  bearingDegrees,
  buildAvoidanceRoute,
  isRestrictedGpsZonePayload,
  isValidGps,
  type GpsPoint,
  type RestrictedGpsZone,
  withDefaultRestrictedGpsZones,
} from './gpsRoutePlanner'

type GpsPosition = {
  latitude: number
  longitude: number
  relativeAltitudeM?: number
}

type Props = {
  missionId: string
  target: { latitude: number; longitude: number } | null
  drone: GpsPosition | null
}

function sameGpsPoint(from: GpsPoint, to: GpsPoint) {
  return from.latitude === to.latitude && from.longitude === to.longitude
}

function lerpGpsPoint(from: GpsPoint, to: GpsPoint, progress: number): GpsPoint {
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * progress,
    longitude: from.longitude + (to.longitude - from.longitude) * progress,
  }
}

function droneArrowIcon(rotationDegrees: number) {
  return L.divIcon({
    className: 'satellite-drone-arrow-icon',
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    html: `
      <div class="satellite-drone-arrow" style="transform: rotate(${rotationDegrees}deg)">
        <svg viewBox="0 0 42 42" aria-hidden="true" focusable="false">
          <circle cx="21" cy="21" r="17" fill="rgba(21, 101, 232, .2)" stroke="rgba(255,255,255,.75)" stroke-width="2"></circle>
          <path d="M21 5 32 35 21 29 10 35Z" fill="#1565e8" stroke="#ffffff" stroke-width="2.8" stroke-linejoin="round"></path>
          <circle cx="21" cy="21" r="3.2" fill="#ffffff"></circle>
        </svg>
      </div>
    `,
  })
}

export function SatelliteFlightMap({ missionId, target, drone }: Props) {
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
  const centeredOnDrone = useRef(false)

  useEffect(() => {
    if (!container.current) return
    const instance = L.map(container.current, { zoomControl: true }).setView([0, 0], 2)
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics, GIS User Community',
      },
    ).addTo(instance)
    track.current = L.polyline([], { color: 'transparent', weight: 0, opacity: 0 }).addTo(instance)
    targetLine.current = L.polyline([], {
      color: '#60a5fa',
      dashArray: '10 8',
      opacity: 0.95,
      weight: 2,
    }).addTo(instance)
    map.current = instance
    return () => {
      if (droneAnimationFrame.current !== null) window.cancelAnimationFrame(droneAnimationFrame.current)
      instance.remove()
      map.current = null
      droneMarker.current = null
      targetMarker.current = null
      track.current = null
      targetLine.current = null
      displayedDronePoint.current = null
      droneAnimationFrame.current = null
    }
  }, [])

  useEffect(() => {
    let alive = true

    async function loadZones() {
      try {
        const response = await fetch(`${env.apiBaseUrl}/api/zones`, { cache: 'no-store' })
        const payload = await response.json()
        const items = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []
        const restrictedZones = withDefaultRestrictedGpsZones(items
          .filter(isRestrictedGpsZonePayload)
          .map((zone: { id?: string; code?: string; name?: string; coordinates?: number[][] }) => ({
            id: String(zone.id ?? zone.code ?? zone.name ?? 'restricted-zone'),
            code: zone.code,
            name: zone.name,
            coordinates: (zone.coordinates ?? [])
              .map((point) => ({ longitude: Number(point[0]), latitude: Number(point[1]) }))
              .filter(isValidGps),
          }))
          .filter((zone: RestrictedGpsZone) => zone.coordinates.length >= 3))
        if (!alive) return
        zones.current = restrictedZones

        if (!map.current) return
        for (const layer of zoneLayers.current) layer.remove()
        zoneLayers.current = restrictedZones.map((zone: RestrictedGpsZone) =>
          L.polygon(
            zone.coordinates.map((point) => [point.latitude, point.longitude]),
            {
              color: '#ef4444',
              dashArray: '6 6',
              fillColor: '#ef4444',
              fillOpacity: 0.18,
              weight: 2,
            },
          ).addTo(map.current!).bindTooltip(zone.name ?? zone.code ?? 'Vùng cấm bay'),
        )
      } catch {
        if (alive) zones.current = withDefaultRestrictedGpsZones([])
      }
    }

    void loadZones()
    const timer = window.setInterval(loadZones, 10000)
    return () => {
      alive = false
      window.clearInterval(timer)
      for (const layer of zoneLayers.current) layer.remove()
      zoneLayers.current = []
    }
  }, [])

  useEffect(() => {
    if (droneAnimationFrame.current !== null) window.cancelAnimationFrame(droneAnimationFrame.current)
    droneAnimationFrame.current = null
    displayedDronePoint.current = null
    trackPoints.current = []
    track.current?.setLatLngs([])
    targetLine.current?.setLatLngs([])
    centeredOnDrone.current = false
  }, [missionId])

  useEffect(() => {
    if (!map.current) return
    if (!isValidGps(target)) {
      targetMarker.current?.remove()
      targetMarker.current = null
      return
    }
    const point: L.LatLngExpression = [target.latitude, target.longitude]
    if (targetMarker.current) targetMarker.current.setLatLng(point)
    else {
      targetMarker.current = L.circleMarker(point, {
        radius: 9, color: '#fff', weight: 2, fillColor: '#ef4444', fillOpacity: 1,
      }).addTo(map.current).bindTooltip('Mission target')
    }
    if (!centeredOnDrone.current) map.current.setView(point, 16)
  }, [target?.latitude, target?.longitude])

  useEffect(() => {
    if (!map.current) return
    if (!isValidGps(drone)) {
      if (droneAnimationFrame.current !== null) window.cancelAnimationFrame(droneAnimationFrame.current)
      droneAnimationFrame.current = null
      displayedDronePoint.current = null
      droneMarker.current?.remove()
      droneMarker.current = null
      targetLine.current?.setLatLngs([])
      return
    }
    const currentPoint = { latitude: drone.latitude, longitude: drone.longitude }
    const point: L.LatLngExpression = [currentPoint.latitude, currentPoint.longitude]
    const previous = trackPoints.current.at(-1)
    const previousPoint = Array.isArray(previous)
      ? { latitude: Number(previous[0]), longitude: Number(previous[1]) }
      : null
    const heading = isValidGps(target) ? bearingDegrees(currentPoint, target) : 0
    if (droneMarker.current) {
      droneMarker.current.setIcon(droneArrowIcon(heading))
    }
    else {
      droneMarker.current = L.marker(point, {
        icon: droneArrowIcon(heading),
        zIndexOffset: 1000,
      }).addTo(map.current).bindTooltip('PX4 drone')
    }
    const animationStart = displayedDronePoint.current ?? previousPoint ?? currentPoint
    if (droneAnimationFrame.current !== null) window.cancelAnimationFrame(droneAnimationFrame.current)
    if (!sameGpsPoint(animationStart, currentPoint)) {
      const startedAt = window.performance.now()
      const durationMs = 550
      const animate = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / durationMs)
        const nextPoint = lerpGpsPoint(animationStart, currentPoint, progress)
        const nextLatLng: L.LatLngExpression = [nextPoint.latitude, nextPoint.longitude]
        droneMarker.current?.setLatLng(nextLatLng)
        if (isValidGps(target)) {
          droneMarker.current?.setIcon(droneArrowIcon(bearingDegrees(nextPoint, target)))
        }
        displayedDronePoint.current = nextPoint
        if (isValidGps(target)) {
          const route = buildAvoidanceRoute(nextPoint, target, zones.current)
          targetLine.current?.setLatLngs(route.map((routePoint) => [routePoint.latitude, routePoint.longitude]))
        }
        if (progress < 1) droneAnimationFrame.current = window.requestAnimationFrame(animate)
        else droneAnimationFrame.current = null
      }
      droneAnimationFrame.current = window.requestAnimationFrame(animate)
    } else {
      droneMarker.current.setLatLng(point)
      displayedDronePoint.current = currentPoint
    }
    if (!previous || !Array.isArray(previous) || previous[0] !== currentPoint.latitude || previous[1] !== currentPoint.longitude) {
      trackPoints.current.push(point)
      if (trackPoints.current.length > 500) trackPoints.current.shift()
      track.current?.setLatLngs(trackPoints.current)
    }
    if (isValidGps(target)) {
      const route = buildAvoidanceRoute(currentPoint, target, zones.current)
      targetLine.current?.setLatLngs(route.map((routePoint) => [routePoint.latitude, routePoint.longitude]))
    }
    else targetLine.current?.setLatLngs([])
    if (!centeredOnDrone.current) {
      map.current.setView(point, 17)
      centeredOnDrone.current = true
    }
  }, [drone?.latitude, drone?.longitude])

  return <div ref={container} className="satellite-flight-map" role="application" aria-label="Live satellite flight map" />
}
