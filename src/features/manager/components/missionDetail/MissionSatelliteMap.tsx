import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { HCMC_SERVICE_CENTER } from '../../../../shared/lib/serviceArea'

type GpsPoint = { latitude: number; longitude: number }

const TAN_SON_NHAT_NO_FLY_ZONE: GpsPoint[] = [
  { longitude: 106.6348, latitude: 10.8079 },
  { longitude: 106.6348, latitude: 10.8142 },
  { longitude: 106.638, latitude: 10.8179 },
  { longitude: 106.6479, latitude: 10.8212 },
  { longitude: 106.6548, latitude: 10.8219 },
  { longitude: 106.661, latitude: 10.8232 },
  { longitude: 106.67, latitude: 10.8258 },
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
  { longitude: 106.661, latitude: 10.809 },
  { longitude: 106.6587, latitude: 10.8103 },
  { longitude: 106.6514, latitude: 10.8095 },
  { longitude: 106.6438, latitude: 10.8077 },
  { longitude: 106.6376, latitude: 10.8066 },
]

const TSN_NO_FLY_LAT_LNGS: L.LatLngExpression[] =
  TAN_SON_NHAT_NO_FLY_ZONE.map((point) => [
    point.latitude,
    point.longitude,
  ])

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

function orientation(a: GpsPoint, b: GpsPoint, c: GpsPoint) {
  const value =
    (b.longitude - a.longitude) * (c.latitude - a.latitude) -
    (b.latitude - a.latitude) * (c.longitude - a.longitude)
  if (Math.abs(value) < 1e-10) return 0
  return value > 0 ? 1 : -1
}

function onSegment(a: GpsPoint, b: GpsPoint, c: GpsPoint) {
  return (
    Math.min(a.longitude, c.longitude) <= b.longitude + 1e-10 &&
    b.longitude <= Math.max(a.longitude, c.longitude) + 1e-10 &&
    Math.min(a.latitude, c.latitude) <= b.latitude + 1e-10 &&
    b.latitude <= Math.max(a.latitude, c.latitude) + 1e-10
  )
}

function segmentsIntersect(
  a: GpsPoint,
  b: GpsPoint,
  c: GpsPoint,
  d: GpsPoint,
) {
  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)
  if (o1 !== o2 && o3 !== o4) return true
  if (o1 === 0 && onSegment(a, c, b)) return true
  if (o2 === 0 && onSegment(a, d, b)) return true
  if (o3 === 0 && onSegment(c, a, d)) return true
  return o4 === 0 && onSegment(c, b, d)
}

function pointInsidePolygon(point: GpsPoint, polygon: GpsPoint[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    const crosses =
      a.latitude > point.latitude !== b.latitude > point.latitude &&
      point.longitude <
        ((b.longitude - a.longitude) * (point.latitude - a.latitude)) /
          (b.latitude - a.latitude) +
          a.longitude
    if (crosses) inside = !inside
  }
  return inside
}

function segmentTouchesPolygon(a: GpsPoint, b: GpsPoint, polygon: GpsPoint[]) {
  if (pointInsidePolygon(a, polygon) || pointInsidePolygon(b, polygon)) {
    return true
  }
  return polygon.some((point, index) =>
    segmentsIntersect(
      a,
      b,
      point,
      polygon[(index + 1) % polygon.length],
    ),
  )
}

function routeTouchesPolygon(route: GpsPoint[], polygon: GpsPoint[]) {
  return route.some((point, index) => {
    const next = route[index + 1]
    return next ? segmentTouchesPolygon(point, next, polygon) : false
  })
}

function routeDistance(route: GpsPoint[]) {
  return route.reduce((total, point, index) => {
    const next = route[index + 1]
    if (!next) return total
    const latM = (next.latitude - point.latitude) * 111_320
    const lonM =
      (next.longitude - point.longitude) *
      111_320 *
      Math.cos((point.latitude * Math.PI) / 180)
    return total + Math.hypot(latM, lonM)
  }, 0)
}

function avoidNoFlyRoute(home: GpsPoint, target: GpsPoint) {
  const direct = [home, target]
  if (!routeTouchesPolygon(direct, TAN_SON_NHAT_NO_FLY_ZONE)) return direct

  const lats = TAN_SON_NHAT_NO_FLY_ZONE.map((point) => point.latitude)
  const lons = TAN_SON_NHAT_NO_FLY_ZONE.map((point) => point.longitude)
  const pad = 0.006
  const north = Math.max(...lats) + pad
  const south = Math.min(...lats) - pad
  const east = Math.max(...lons) + pad
  const west = Math.min(...lons) - pad
  const candidates: GpsPoint[][] = [
    [home, { latitude: north, longitude: west }, target],
    [home, { latitude: north, longitude: east }, target],
    [home, { latitude: south, longitude: west }, target],
    [home, { latitude: south, longitude: east }, target],
    [
      home,
      { latitude: south, longitude: east },
      { latitude: north, longitude: east },
      target,
    ],
    [
      home,
      { latitude: south, longitude: west },
      { latitude: north, longitude: west },
      target,
    ],
  ]
  return (
    candidates
      .filter((route) => !routeTouchesPolygon(route, TAN_SON_NHAT_NO_FLY_ZONE))
      .sort((a, b) => routeDistance(a) - routeDistance(b))[0] ?? direct
  )
}

function routeMarkerIcon(label: string, color: string) {
  return L.divIcon({
    html: `<div style="
      min-width:42px;
      height:24px;
      padding:0 8px;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      box-sizing:border-box;
      background:${color};
      color:#fff;
      border:2px solid #fff;
      box-shadow:0 3px 10px rgba(15,23,42,.28);
      font-size:10px;
      font-weight:800;
      line-height:1;
    ">${label}</div>`,
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
  latitude: number | null
  longitude: number | null
  radiusMeters?: number | null
}) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const homeMarker = useRef<L.Marker | null>(null)
  const targetMarker = useRef<L.Marker | null>(null)
  const routeLine = useRef<L.Polyline | null>(null)
  const targetPin = useRef<L.Marker | null>(null)
  const circle = useRef<L.Circle | null>(null)
  const noFlyZone = useRef<L.Polygon | null>(null)
  const target = validGps({ latitude: latitude ?? Number.NaN, longitude: longitude ?? Number.NaN })
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
      noFlyZone.current = null
    }
  }, [homePoint.latitude, homePoint.longitude, targetLat, targetLon])

  useEffect(() => {
    if (!map.current) return
    const home: L.LatLngExpression = [homePoint.latitude, homePoint.longitude]

    if (noFlyZone.current) {
      noFlyZone.current.setLatLngs(TSN_NO_FLY_LAT_LNGS)
    } else {
      noFlyZone.current = L.polygon(TSN_NO_FLY_LAT_LNGS, {
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.22,
        weight: 2,
      })
        .addTo(map.current)
        .bindTooltip('Vùng cấm bay sân bay Tân Sơn Nhất')
    }

    if (!target) {
      map.current.setView(home, 11)
      return
    }

    const targetLatLng: L.LatLngExpression = [target.latitude, target.longitude]
    const route = avoidNoFlyRoute(homePoint, target)
    const routeLatLngs = route.map(
      (routePoint) =>
        [routePoint.latitude, routePoint.longitude] as L.LatLngExpression,
    )

    if (homeMarker.current) {
      homeMarker.current.setLatLng(home)
    } else {
      homeMarker.current = L.marker(home, {
        icon: routeMarkerIcon('HOME', '#16a34a'),
        keyboard: false,
      })
        .addTo(map.current)
        .bindTooltip('Điểm xuất phát')
    }

    if (targetMarker.current) {
      targetMarker.current.setLatLng(targetLatLng)
    } else {
      targetMarker.current = L.marker(targetLatLng, {
        icon: routeMarkerIcon('TARGET', '#dc2626'),
        keyboard: false,
      })
        .addTo(map.current)
        .bindTooltip('Điểm giám sát')
    }

    if (routeLine.current) {
      routeLine.current.setLatLngs(routeLatLngs)
    } else {
      routeLine.current = L.polyline(routeLatLngs, {
        color: '#2563eb',
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
        .bindTooltip('Điểm giám sát')
    }

    if (radiusMeters && radiusMeters > 0) {
      if (circle.current) {
        circle.current.setLatLng(targetLatLng).setRadius(radiusMeters)
      } else {
        circle.current = L.circle(targetLatLng, {
          radius: radiusMeters,
          color: '#16a34a',
          fillColor: '#22c55e',
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
    if (noFlyZone.current) bounds.extend(noFlyZone.current.getBounds())
    map.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 })
  }, [homePoint, radiusMeters, targetLat, targetLon])

  return (
    <div className="odm-rm-satellite" role="application" aria-label="Bản đồ vệ tinh mission">
      <div ref={container} className="odm-rm-leaflet" />
      {target ? (
        <div className="odm-rm-chip odm-rm-chip-target">
          ĐIỂM GIÁM SÁT · {target.latitude.toFixed(6)}, {target.longitude.toFixed(6)}
        </div>
      ) : null}
      {target ? (
        <div className="odm-rm-chip odm-rm-chip-route">
          Đường bay: HOME → điểm giám sát
        </div>
      ) : null}
      {radiusMeters ? (
        <div className="odm-rm-chip odm-rm-chip-radius">
          Bán kính giám sát: {Math.round(radiusMeters)} m
        </div>
      ) : null}
      <div className="odm-rm-chip odm-rm-chip-zone">
        Vùng cấm bay Tân Sơn Nhất
      </div>
      {!target ? <div className="odm-rm-empty">Chưa có tọa độ mission</div> : null}
    </div>
  )
}
