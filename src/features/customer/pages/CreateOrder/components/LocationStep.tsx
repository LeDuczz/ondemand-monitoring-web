import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { env } from '../../../../../config/env'
import { useI18n } from '../../../../../shared/i18n'
import {
  HCMC_SERVICE_CENTER,
  hcmcServicePolygonLatLngs,
  isInsideHcmcServiceArea,
} from '../../../../../shared/lib/serviceArea'
import type { FormErrors, FormState, UpdateField } from '../../../lib/createOrder/types'
import { LocationPanel } from './LocationPanel'
import { locationStepMessages } from './LocationStep.messages'

type Props = {
  form: FormState
  errors: FormErrors
  update: UpdateField
}

type GeocodeResult = {
  latitude: number
  longitude: number
  displayName?: string
}

type ApiResponse<T> = {
  success?: boolean
  message?: string
  data?: T
}

function RealLocationMap({ latitude, longitude, radiusM, label, onPick }: {
  latitude: string
  longitude: string
  radiusM: number
  label: string
  onPick: (latitude: number, longitude: number) => void
}) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const circle = useRef<L.Circle | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const serviceArea = useRef<L.Polygon | null>(null)
  const onPickRef = useRef(onPick)
  const [tilesFailed, setTilesFailed] = useState(false)
  const loadedTileCount = useRef(0)
  onPickRef.current = onPick

  function markTileLoaded() {
    loadedTileCount.current += 1
    setTilesFailed(false)
  }

  function markTileFailed(kind: string, event: L.TileErrorEvent) {
    const tile = event.tile as HTMLImageElement | undefined
    console.warn(`[CreateRequestMap] ${kind} tile failed to load`, {
      url: tile?.src,
      coords: event.coords,
      error: event.error,
    })
    if (loadedTileCount.current === 0) {
      setTilesFailed(true)
    }
  }

  useEffect(() => {
    if (!container.current) return
    const instance = L.map(container.current, {
      zoomControl: true,
      attributionControl: false,
      layers: [],
    }).setView([HCMC_SERVICE_CENTER.latitude, HCMC_SERVICE_CENTER.longitude], 12)

    const streetFallbackLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    )
      .on('tileload', markTileLoaded)
      .on('tileerror', (event: L.TileErrorEvent) => markTileFailed('Street fallback', event))

    const osmLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
      crossOrigin: true,
    })
      .on('tileload', markTileLoaded)
      .on('tileerror', (event: L.TileErrorEvent) => markTileFailed('Map', event))

    const streetLayer = L.layerGroup([streetFallbackLayer, osmLayer]).addTo(instance)

    const satelliteLayer = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    )
      .on('tileload', markTileLoaded)
      .on('tileerror', (event: L.TileErrorEvent) => markTileFailed('Satellite', event))

    L.control
      .layers(
        {
          'Bản đồ': streetLayer,
          'Vệ tinh': satelliteLayer,
        },
        undefined,
        { position: 'topright', collapsed: false },
      )
      .addTo(instance)

    serviceArea.current = L.polygon(hcmcServicePolygonLatLngs(), {
      color: '#16a34a',
      fillColor: '#22c55e',
      fillOpacity: 0.08,
      weight: 2,
    }).addTo(instance)

    instance.on('click', (event: L.LeafletMouseEvent) => {
      onPickRef.current(event.latlng.lat, event.latlng.lng)
    })
    instance.on('baselayerchange', () => {
      loadedTileCount.current = 0
      setTilesFailed(false)
    })
    map.current = instance
    window.setTimeout(() => instance.invalidateSize(), 0)
    return () => {
      instance.remove()
      map.current = null
      circle.current = null
      marker.current = null
      serviceArea.current = null
    }
  }, [])

  useEffect(() => {
    const lat = Number(latitude)
    const lng = Number(longitude)
    if (!map.current || !latitude || !longitude || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return
    const center: L.LatLngExpression = [lat, lng]
    if (marker.current) {
      marker.current.setLatLng(center)
    } else {
      marker.current = L.marker(center).addTo(map.current)
    }
    if (circle.current) {
      circle.current.setLatLng(center).setRadius(radiusM)
    } else {
      circle.current = L.circle(center, {
        radius: radiusM,
        color: '#1565e8',
        fillColor: '#1565e8',
        fillOpacity: 0.14,
      }).addTo(map.current)
    }
    map.current.setView(center, 16)
  }, [latitude, longitude, radiusM])

  const lat = Number(latitude)
  const lng = Number(longitude)
  const invalidCoordinates =
    Boolean(latitude || longitude) &&
    (!Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180)
  const outsideServiceArea =
    !invalidCoordinates &&
    Boolean(latitude && longitude) &&
    !isInsideHcmcServiceArea({ latitude: lat, longitude: lng })

  return (
    <div className="co-real-map-wrap">
      <div
        ref={container}
        className={`co-real-map${tilesFailed ? ' has-tile-fallback' : ''}`}
        role="application"
        aria-label={label}
      />
      {invalidCoordinates ? (
        <div className="co-real-map-notice">Vĩ độ phải từ -90 đến 90, kinh độ từ -180 đến 180.</div>
      ) : null}
      {outsideServiceArea ? (
        <div className="co-real-map-notice">Hiện chỉ phục vụ trong khu vực TP.HCM. Vui lòng chọn điểm trong vùng xanh.</div>
      ) : null}
    </div>
  )
}

/** Customer chooses a WGS84 target, not a point on the Gazebo image. */
export function LocationStep({ form, errors, update }: Props) {
  const { t } = useI18n(locationStepMessages)
  const [locatingAddress, setLocatingAddress] = useState(false)
  const [addressLookupError, setAddressLookupError] = useState<string | null>(null)
  const reverseLookupId = useRef(0)

  async function locateAddress() {
    const query = form.address.trim()
    if (!query || locatingAddress) return

    setLocatingAddress(true)
    setAddressLookupError(null)
    try {
      const params = new URLSearchParams({ q: query })
      const response = await fetch(
        `${env.apiBaseUrl}/api/geocoding/search?${params.toString()}`,
        {
          headers: {
            Accept: 'application/json',
          },
          credentials: 'include',
        },
      )
      const payload = (await response.json().catch(() => null)) as ApiResponse<GeocodeResult> | null
      if (!response.ok || payload?.success === false) {
        if (response.status === 404) {
          setAddressLookupError('NOT_FOUND')
          return
        }
        throw new Error(payload?.message ?? `HTTP ${response.status}`)
      }
      const place = payload?.data
      if (!place) {
        setAddressLookupError('NOT_FOUND')
        return
      }
      const lat = Number(place.latitude)
      const lng = Number(place.longitude)
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setAddressLookupError('NOT_FOUND')
        return
      }
      update('latitude', lat.toFixed(7))
      update('longitude', lng.toFixed(7))
    } catch (error) {
      console.error('[CreateRequestMap] Address geocoding failed', error)
      setAddressLookupError(error instanceof Error ? error.message : 'Không thể tìm địa chỉ.')
    } finally {
      setLocatingAddress(false)
    }
  }

  async function updateAddressFromPoint(latitude: number, longitude: number) {
    const lookupId = reverseLookupId.current + 1
    reverseLookupId.current = lookupId
    update('latitude', latitude.toFixed(7))
    update('longitude', longitude.toFixed(7))
    setAddressLookupError(null)

    try {
      const params = new URLSearchParams({
        latitude: latitude.toFixed(7),
        longitude: longitude.toFixed(7),
      })
      const response = await fetch(
        `${env.apiBaseUrl}/api/geocoding/reverse?${params.toString()}`,
        {
          headers: {
            Accept: 'application/json',
          },
          credentials: 'include',
        },
      )
      const payload = (await response.json().catch(() => null)) as ApiResponse<GeocodeResult> | null
      if (lookupId !== reverseLookupId.current) return
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.message ?? `HTTP ${response.status}`)
      }
      const address = payload?.data?.displayName?.trim()
      if (address) {
        update('address', address)
      }
    } catch (error) {
      if (lookupId !== reverseLookupId.current) return
      console.error('[CreateRequestMap] Reverse geocoding failed', error)
      setAddressLookupError(error instanceof Error ? error.message : 'Không thể tìm địa chỉ tại vị trí này.')
    }
  }

  return (
    <div className="co-stack">
      <div className="co-grid">
        <RealLocationMap
          latitude={form.latitude}
          longitude={form.longitude}
          radiusM={form.radiusM}
          label={t.mapLabel}
          onPick={(latitude, longitude) => {
            void updateAddressFromPoint(latitude, longitude)
          }}
        />
        <LocationPanel
          form={form}
          errors={errors}
          update={update}
          locatingAddress={locatingAddress}
          addressLookupError={addressLookupError}
          onLocateAddress={locateAddress}
        />
      </div>
    </div>
  )
}
