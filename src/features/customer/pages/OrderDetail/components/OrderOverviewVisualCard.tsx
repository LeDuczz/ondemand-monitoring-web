import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { useApiQuery } from '../../../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../../../shared/i18n'
import { customerApi } from '../../../api/customerApi'
import { localizeServiceName } from '../../../lib/i18n/serviceNames'
import type { OrderDetailView } from '../../../lib/orders/types'
import { orderOverviewVisualCardMessages } from './OrderOverviewVisualCard.messages'
import { OrderIcon } from '../../../../manager/components/common/OrderIcon'

function ReadonlyOrderMap({
  order,
  layerLabels,
  mapLabel,
}: {
  order: OrderDetailView
  layerLabels: { street: string; satellite: string }
  mapLabel: string
}) {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!container.current || order.latitude == null || order.longitude == null) return
    const center: L.LatLngExpression = [order.latitude, order.longitude]
    const map = L.map(container.current, {
      attributionControl: false,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: false,
    }).setView(center, 15)
    const streetFallback = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    )
    const osm = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
      crossOrigin: true,
    })
    osm.on('tileerror', () => {
      // Keep the Esri street layer visible when OSM is unavailable or rate-limited.
      if (map.hasLayer(osm)) map.removeLayer(osm)
    })
    const streetLayer = L.layerGroup([streetFallback, osm]).addTo(map)
    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    )
    L.control
      .layers(
        {
          [layerLabels.street]: streetLayer,
          [layerLabels.satellite]: satelliteLayer,
        },
        undefined,
        { position: 'topright', collapsed: false },
      )
      .addTo(map)
    const radius = Math.max(order.radiusM ?? 0, 1)
    const area = L.circle(center, {
      radius,
      color: '#1677ff',
      weight: 2,
      fillColor: '#4096ff',
      fillOpacity: 0.16,
    }).addTo(map)
    L.circleMarker(center, {
      radius: 7,
      color: '#fff',
      weight: 3,
      fillColor: '#0958d9',
      fillOpacity: 1,
    }).addTo(map)
    if (order.radiusM) map.fitBounds(area.getBounds(), { padding: [28, 28], maxZoom: 16 })
    window.setTimeout(() => map.invalidateSize(), 0)
    return (): void => {
      map.remove()
    }
  }, [layerLabels.satellite, layerLabels.street, order.latitude, order.longitude, order.radiusM])

  return <div ref={container} className="od-order-map" aria-label={mapLabel} />
}

export function OrderOverviewVisualCard({ order }: { order: OrderDetailView }) {
  const { t, lang } = useI18n(orderOverviewVisualCardMessages)
  const layerLabels = useMemo(
    () => ({ street: t.street, satellite: t.satellite }),
    [t.street, t.satellite],
  )
  const services = useApiQuery((signal) => customerApi.listServices(signal), [])
  const service = useMemo(
    () => services.data?.find((item) => item.id === order.serviceId),
    [services.data, order.serviceId],
  )
  const [failed, setFailed] = useState<string[]>([])
  const image = [service?.imageUrl, service?.fallbackImageUrl].find(
    (value): value is string => Boolean(value) && !failed.includes(value!),
  )
  const serviceName = localizeServiceName(
    order.serviceId ?? order.serviceName ?? '',
    lang,
    order.serviceName ?? service?.name ?? '',
  )

  return (
    <section className="od-overview-visual" aria-label={t.sectionLabel}>
      <div className="od-service-hero">
        {image ? (
          <img src={image} alt="" onError={() => setFailed((items) => [...items, image])} />
        ) : (
          <div className="od-service-placeholder" aria-hidden="true">
            <OrderIcon name="drone" size={34} />
          </div>
        )}
        <div className="od-service-hero-overlay">
          <span>{t.selectedService}</span>
          <strong>{serviceName || order.serviceName || '—'}</strong>
          {service?.description ? <p>{service.description}</p> : null}
        </div>
      </div>
      <div className="od-map-panel">
        {order.latitude != null && order.longitude != null ? (
          <ReadonlyOrderMap order={order} layerLabels={layerLabels} mapLabel={t.mapLabel} />
        ) : (
          <div className="od-map-empty">
            <OrderIcon name="pin" size={24} />
            <span>{t.noCoordinates}</span>
          </div>
        )}
        <div className="od-map-caption">
          <strong>{order.address || t.locationFallback}</strong>
          <span>{order.radiusM != null ? t.radius(order.radiusM) : t.noRadius}</span>
        </div>
      </div>
    </section>
  )
}
