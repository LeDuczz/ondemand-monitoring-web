import { useEffect, useState } from 'react'

import { apiRequest } from '../../../../../shared/api/httpClient'

/** Matches `SimulationZoneSeeder.GPS_COORDINATE_SYSTEM`: polygons whose coordinates are real lon/lat. */
const GPS_COORDINATE_SYSTEM = 'WGS84_GPS_LON_LAT'

export type RestrictedZoneOverlay = {
  id: string
  name: string
  /** Leaflet order: [lat, lng]. */
  latLngs: [number, number][]
}

type ZoneItem = {
  id?: string
  name?: string
  restricted?: boolean
  coordinateSystem?: string
  /** `[lon, lat]` pairs. */
  coordinates?: number[][]
}

/**
 * Restricted zones that can be drawn on the real map. Reuses the existing `GET /api/zones` list; the
 * assessment endpoint itself never carries geometry. Simulation (local-metre) zones are skipped.
 */
export function useRestrictedZoneOverlay(): RestrictedZoneOverlay[] {
  const [zones, setZones] = useState<RestrictedZoneOverlay[]>([])

  useEffect(() => {
    const controller = new AbortController()
    apiRequest<ZoneItem[]>('/api/zones', { signal: controller.signal })
      .then((items) => {
        if (!Array.isArray(items)) return
        setZones(
          items.flatMap((zone) => {
            if (!zone.restricted || zone.coordinateSystem !== GPS_COORDINATE_SYSTEM) return []
            const latLngs = (zone.coordinates ?? [])
              .filter((pair) => pair.length >= 2 && Number.isFinite(pair[0]) && Number.isFinite(pair[1]))
              .map((pair) => [pair[1], pair[0]] as [number, number])
            return latLngs.length >= 3
              ? [{ id: zone.id ?? zone.name ?? String(latLngs[0]), name: zone.name ?? '', latLngs }]
              : []
          }),
        )
      })
      .catch(() => {
        // The overlay is a convenience; the assessment card does not depend on it.
      })
    return () => controller.abort()
  }, [])

  return zones
}
