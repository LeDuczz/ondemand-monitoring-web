import { useEffect } from 'react'
import L from 'leaflet'
import { getLanguage } from '../../../../../shared/i18n'
import { bearingDegrees, buildFlightPath, isValidGps } from '../gpsRoutePlanner'
import { droneArrowIcon } from './droneArrowIcon'
import { satelliteFlightMapMessages } from './SatelliteFlightMap.messages'
import {
  lerpGpsPoint,
  sameGpsPoint,
  type GpsPosition,
} from './satelliteMapHelpers'
import type { SatelliteMapRefs } from './useSatelliteMapRefs'

export function useDroneMarker(
  {
    map,
    droneMarker,
    track,
    targetLine,
    zones,
    trackPoints,
    displayedDronePoint,
    droneAnimationFrame,
    lastDroneUpdateAt,
    centeredOnDrone,
  }: SatelliteMapRefs,
  drone: GpsPosition | null,
  target: { latitude: number; longitude: number } | null,
) {
  useEffect(() => {
    if (!map.current) return
    if (!isValidGps(drone)) {
      if (droneAnimationFrame.current !== null)
        window.cancelAnimationFrame(droneAnimationFrame.current)
      droneAnimationFrame.current = null
      displayedDronePoint.current = null
      droneMarker.current?.remove()
      droneMarker.current = null
      targetLine.current?.setLatLngs([])
      return
    }
    const currentPoint = {
      latitude: drone.latitude,
      longitude: drone.longitude,
    }
    const point: L.LatLngExpression = [
      currentPoint.latitude,
      currentPoint.longitude,
    ]
    const previous = trackPoints.current.at(-1)
    const previousPoint = Array.isArray(previous)
      ? { latitude: Number(previous[0]), longitude: Number(previous[1]) }
      : null
    const flightPath = isValidGps(target)
      ? buildFlightPath(currentPoint, target, zones.current)
      : []
    const heading =
      flightPath.length > 1 ? bearingDegrees(currentPoint, flightPath[1]) : 0
    // Rotate the existing icon in place. Replacing the icon (setIcon) rebuilt the DOM on every
    // frame, which was expensive and restarted the rotor animation.
    const setMarkerHeading = (deg: number) => {
      const el = droneMarker.current
        ?.getElement()
        ?.querySelector<HTMLElement>('.satellite-drone-arrow')
      if (el) el.style.transform = `rotate(${deg}deg)`
    }
    if (droneMarker.current) {
      setMarkerHeading(heading)
    } else {
      droneMarker.current = L.marker(point, {
        icon: droneArrowIcon(heading),
        zIndexOffset: 1000,
      })
        .addTo(map.current)
        .bindTooltip(satelliteFlightMapMessages[getLanguage()].droneTooltip)
    }
    // Animate over the time we expect until the next telemetry sample (the last measured
    // interval), so the marker glides continuously instead of "move 0.5s, then stand still".
    const updateAt = window.performance.now()
    const measuredIntervalMs =
      lastDroneUpdateAt.current === null
        ? 600
        : updateAt - lastDroneUpdateAt.current
    lastDroneUpdateAt.current = updateAt
    const durationMs = Math.max(250, Math.min(3000, measuredIntervalMs))
    const animationStart =
      displayedDronePoint.current ?? previousPoint ?? currentPoint
    if (droneAnimationFrame.current !== null)
      window.cancelAnimationFrame(droneAnimationFrame.current)
    if (!sameGpsPoint(animationStart, currentPoint)) {
      const startedAt = updateAt
      let lastRouteAt = 0
      const animate = (now: number) => {
        const progress = Math.min(1, (now - startedAt) / durationMs)
        const nextPoint = lerpGpsPoint(animationStart, currentPoint, progress)
        const nextLatLng: L.LatLngExpression = [
          nextPoint.latitude,
          nextPoint.longitude,
        ]
        droneMarker.current?.setLatLng(nextLatLng)
        displayedDronePoint.current = nextPoint
        // Route planning is the costly part: refresh it ~8x per second, not every frame.
        if (isValidGps(target) && (now - lastRouteAt >= 120 || progress >= 1)) {
          lastRouteAt = now
          const route = buildFlightPath(nextPoint, target, zones.current)
          setMarkerHeading(
            route.length > 1 ? bearingDegrees(nextPoint, route[1]) : 0,
          )
          targetLine.current?.setLatLngs(
            route.map((routePoint) => [
              routePoint.latitude,
              routePoint.longitude,
            ]),
          )
        }
        if (progress < 1)
          droneAnimationFrame.current = window.requestAnimationFrame(animate)
        else {
          droneAnimationFrame.current = null
          // keep the drone on screen while it flies
          const instance = map.current
          if (
            instance &&
            !instance.getBounds().pad(-0.2).contains(nextLatLng)
          ) {
            instance.panTo(nextLatLng, { animate: true, duration: 0.8 })
          }
        }
      }
      droneAnimationFrame.current = window.requestAnimationFrame(animate)
    } else {
      droneMarker.current.setLatLng(point)
      displayedDronePoint.current = currentPoint
    }
    if (
      !previous ||
      !Array.isArray(previous) ||
      previous[0] !== currentPoint.latitude ||
      previous[1] !== currentPoint.longitude
    ) {
      trackPoints.current.push(point)
      if (trackPoints.current.length > 500) trackPoints.current.shift()
      track.current?.setLatLngs(trackPoints.current)
    }
    if (isValidGps(target)) {
      const route = buildFlightPath(currentPoint, target, zones.current)
      targetLine.current?.setLatLngs(
        route.map((routePoint) => [routePoint.latitude, routePoint.longitude]),
      )
    } else targetLine.current?.setLatLngs([])
    if (!centeredOnDrone.current) {
      map.current.setView(point, 17)
      centeredOnDrone.current = true
    }
  }, [drone?.latitude, drone?.longitude])
}
