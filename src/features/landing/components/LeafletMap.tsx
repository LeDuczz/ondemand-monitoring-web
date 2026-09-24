import { useEffect, useRef } from 'react'

declare const L: typeof import('leaflet')

const CENTER: [number, number] = [10.787, 106.7225]
const NO_FLY: [number, number] = [10.7925, 106.7135]
const ROUTE: [number, number][] = [
  [10.7885, 106.716],
  [10.7876, 106.7195],
  [10.787, 106.7225],
]

function droneIcon() {
  return L.divIcon({
    className: '',
    html: '<div style="width:38px;height:38px;border-radius:50%;background:#1565E8;border:3px solid #fff;box-shadow:0 4px 12px rgba(21,101,232,.6);display:grid;place-items:center;font-size:18px">🚁</div>',
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  })
}

export function HeroMap({ id, className }: { id: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    if (typeof L === 'undefined') return

    const map = L.map(ref.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(CENTER, 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map)

    L.circle(CENTER, {
      radius: 500,
      color: '#1565E8',
      weight: 2,
      fillColor: '#1565E8',
      fillOpacity: 0.14,
    })
      .addTo(map)
      .bindTooltip('Bán kính 500 m', { permanent: true, direction: 'top' })

    L.circle(NO_FLY, {
      radius: 260,
      color: '#E5484D',
      weight: 2,
      fillColor: '#E5484D',
      fillOpacity: 0.25,
      dashArray: '6',
    })
      .addTo(map)
      .bindTooltip('Vùng cấm bay', { permanent: true, direction: 'center' })

    L.polyline(ROUTE, { color: '#1565E8', weight: 3, dashArray: '8 8' }).addTo(map)
    L.marker(ROUTE[0]).addTo(map).bindTooltip('Trạm H')
    L.marker(CENTER, { icon: droneIcon() }).addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return <div id={id} ref={ref} className={className} style={{ height: 420 }} />
}

export function LiveMap({ id, className }: { id: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!ref.current || mapRef.current) return
    if (typeof L === 'undefined') return

    const map = L.map(ref.current, {
      scrollWheelZoom: false,
      zoomControl: true,
    }).setView(CENTER, 16)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map)

    const route: [number, number][] = [
      [10.785, 106.719],
      [10.7858, 106.7212],
      [10.7871, 106.7222],
      [10.7886, 106.724],
    ]
    L.polyline(route, { color: '#1565E8', weight: 4 }).addTo(map)
    route.forEach((p, i) => {
      L.circleMarker(p, {
        radius: 7,
        color: '#fff',
        weight: 2,
        fillColor: '#1565E8',
        fillOpacity: 1,
      })
        .addTo(map)
        .bindTooltip(String(i + 1))
    })
    L.marker(route[2], { icon: droneIcon() }).addTo(map)

    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div
      id={id}
      ref={ref}
      className={className}
      style={{ height: 300, borderRadius: 12, marginBottom: 14 }}
    />
  )
}
