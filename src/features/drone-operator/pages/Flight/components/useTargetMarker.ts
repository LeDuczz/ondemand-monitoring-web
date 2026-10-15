import { useEffect } from 'react'
import L from 'leaflet'
import { getLanguage } from '../../../../../shared/i18n'
import { isValidGps } from '../gpsRoutePlanner'
import { satelliteFlightMapMessages } from './SatelliteFlightMap.messages'
import type { SatelliteMapRefs } from './useSatelliteMapRefs'

export function useTargetMarker(
  { map, targetMarker, centeredOnDrone }: SatelliteMapRefs,
  target: { latitude: number; longitude: number } | null,
) {
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
        radius: 9,
        color: '#fff',
        weight: 2,
        fillColor: '#ef4444',
        fillOpacity: 1,
      })
        .addTo(map.current)
        .bindTooltip(satelliteFlightMapMessages[getLanguage()].missionTarget)
    }
    if (!centeredOnDrone.current) map.current.setView(point, 16)
  }, [target?.latitude, target?.longitude])
}
