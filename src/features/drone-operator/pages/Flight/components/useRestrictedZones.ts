import { useEffect } from 'react'
import { env } from '../../../../../config/env'
import {
  isRestrictedGpsZonePayload,
  isValidGps,
  type RestrictedGpsZone,
  withDefaultRestrictedGpsZones,
} from '../gpsRoutePlanner'
import L from 'leaflet'
import { getLanguage } from '../../../../../shared/i18n'
import { satelliteFlightMapMessages } from './SatelliteFlightMap.messages'
import type { SatelliteMapRefs } from './useSatelliteMapRefs'

export function useRestrictedZones({
  map,
  zones,
  zoneLayers,
}: SatelliteMapRefs) {
  useEffect(() => {
    let alive = true

    async function loadZones() {
      try {
        const response = await fetch(`${env.apiBaseUrl}/api/zones`, {
          cache: 'no-store',
        })
        const payload = await response.json()
        const items = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []
        const restrictedZones = withDefaultRestrictedGpsZones(
          items
            .filter(isRestrictedGpsZonePayload)
            .map(
              (zone: {
                id?: string
                code?: string
                name?: string
                coordinates?: number[][]
              }) => ({
                id: String(
                  zone.id ?? zone.code ?? zone.name ?? 'restricted-zone',
                ),
                code: zone.code,
                name: zone.name,
                coordinates: (zone.coordinates ?? [])
                  .map((point) => ({
                    longitude: Number(point[0]),
                    latitude: Number(point[1]),
                  }))
                  .filter(isValidGps),
              }),
            )
            .filter((zone: RestrictedGpsZone) => zone.coordinates.length >= 3),
        )
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
          )
            .addTo(map.current!)
            .bindTooltip(
              zone.name ??
                zone.code ??
                satelliteFlightMapMessages[getLanguage()].restrictedZone,
            ),
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
}
