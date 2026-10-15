import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { HCMC_SERVICE_CENTER } from '../../../../../shared/lib/serviceArea'
import { useI18n } from '../../../../../shared/i18n'
import { missionSatelliteMapMessages } from './MissionSatelliteMap.messages'

type GpsPoint = { latitude: number; longitude: number }

function validGps(point: GpsPoint | null) {
  return (
    point !== null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180 &&
    (point.latitude !== 0 || point.longitude !== 0)
  )
}

/** Marker styling lives in missionDetail.css (`.odm-rm-marker.is-*`). */
function routeMarkerIcon(label: string, tone: 'home' | 'target') {
  return L.divIcon({
    html: `<div class="odm-rm-marker is-${tone}">${label}</div>`,
    className: 'odm-rm-route-marker',
    iconSize: [42, 24],
    iconAnchor: [21, 12],
  })
}

export function MissionSatelliteMap({
  latitude,
  longitude,
  radiusMeters,
}: {
  missionId: string
  latitude: number | null
  longitude: number | null
  radiusMeters?: number | null
}) {
  const { t } = useI18n(missionSatelliteMapMessages)

  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const homeMarker = useRef<L.Marker | null>(null)
  const targetMarker = useRef<L.Marker | null>(null)
  const routeLine = useRef<L.Polyline | null>(null)
  const targetPin = useRef<L.Marker | null>(null)
  const circle = useRef<L.Circle | null>(null)
  const target = validGps({
    latitude: latitude ?? Number.NaN,
    longitude: longitude ?? Number.NaN,
  })
    ? { latitude: latitude as number, longitude: longitude as number }
    : null
  const targetLat = target?.latitude
  const targetLon = target?.longitude
  const homePoint = HCMC_SERVICE_CENTER

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    if (!container.current || map.current) return
    const initialCenter: L.LatLngExpression = target
      ? [target.latitude, target.longitude]
      : [homePoint.latitude, homePoint.longitude]
    const instance = L.map(container.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(initialCenter, target ? 16 : 11)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    ).addTo(instance)

    map.current = instance
    window.setTimeout(() => instance.invalidateSize(), 0)
    return () => {
      instance.remove()
      map.current = null
      homeMarker.current = null
      targetMarker.current = null
      routeLine.current = null
      targetPin.current = null
      circle.current = null
    }
  }, [homePoint.latitude, homePoint.longitude, targetLat, targetLon])

  useEffect(() => {
    if (!map.current) return
    const home: L.LatLngExpression = [homePoint.latitude, homePoint.longitude]

    if (!target) {
      map.current.setView(home, 11)
      return
    }

    const targetLatLng: L.LatLngExpression = [target.latitude, target.longitude]
    // The visual line is informational only.
    const route = [homePoint, target]
    const routeLatLngs = route.map(
      (routePoint) =>
        [routePoint.latitude, routePoint.longitude] as L.LatLngExpression,
    )

    if (homeMarker.current) {
      homeMarker.current.setLatLng(home)
    } else {
      homeMarker.current = L.marker(home, {
        icon: routeMarkerIcon('HOME', 'home'),
        keyboard: false,
      })
        .addTo(map.current)
        .bindTooltip(t.startingPoint)
    }

    if (targetMarker.current) {
      targetMarker.current.setLatLng(targetLatLng)
    } else {
      targetMarker.current = L.marker(targetLatLng, {
        icon: routeMarkerIcon('TARGET', 'target'),
        keyboard: false,
      })
        .addTo(map.current)
        .bindTooltip(t.monitoringPoint)
    }

    if (routeLine.current) {
      routeLine.current.setLatLngs(routeLatLngs)
    } else {
      routeLine.current = L.polyline(routeLatLngs, {
        className: 'odm-rm-route',
        weight: 4,
        opacity: 0.95,
        dashArray: '8 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map.current)
    }

    if (targetPin.current) {
      targetPin.current.setLatLng(targetLatLng)
    } else {
      targetPin.current = L.marker(targetLatLng)
        .addTo(map.current)
        .bindTooltip(t.monitoringPoint)
    }

    if (radiusMeters && radiusMeters > 0) {
      if (circle.current) {
        circle.current.setLatLng(targetLatLng).setRadius(radiusMeters)
      } else {
        circle.current = L.circle(targetLatLng, {
          radius: radiusMeters,
          className: 'odm-rm-radius',
          fillOpacity: 0.16,
          weight: 2,
        }).addTo(map.current)
      }
    } else if (circle.current) {
      circle.current.remove()
      circle.current = null
    }

    const bounds = L.latLngBounds([home, targetLatLng])
    if (circle.current) bounds.extend(circle.current.getBounds())
    if (routeLine.current) bounds.extend(routeLine.current.getBounds())
    map.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 })
  }, [homePoint, radiusMeters, targetLat, targetLon])

  return (
    <div
      className="odm-rm-satellite"
      role="application"
      aria-label={t.missionSatelliteMap}
    >
      <div ref={container} className="odm-rm-leaflet" />
      {target ? (
        <div className="odm-rm-chip odm-rm-chip-target">
          {t.diemGiamSat2}
          {target.latitude.toFixed(6)}, {target.longitude.toFixed(6)}
        </div>
      ) : null}
      {target ? (
        <div className="odm-rm-chip odm-rm-chip-route">
          {t.flightPathHomeMonitoringPoint}
        </div>
      ) : null}
      {radiusMeters ? (
        <div className="odm-rm-chip odm-rm-chip-radius">
          {t.monitoringRadius}
          {Math.round(radiusMeters)} m
        </div>
      ) : null}
      {!target ? (
        <div className="odm-rm-empty">{t.noMissionCoordinatesYet}</div>
      ) : null}
    </div>
  )
}
