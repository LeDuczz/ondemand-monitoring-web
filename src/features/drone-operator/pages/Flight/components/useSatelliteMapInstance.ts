import { useEffect } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { SATELLITE_TILE_URL } from '../satelliteSource'
import type { SatelliteMapRefs } from './useSatelliteMapRefs'

export function useSatelliteMapInstance({
  container,
  map,
  droneMarker,
  targetMarker,
  track,
  targetLine,
  displayedDronePoint,
  droneAnimationFrame,
}: SatelliteMapRefs) {
  useEffect(() => {
    if (!container.current) return
    const instance = L.map(container.current, { zoomControl: true }).setView(
      [0, 0],
      2,
    )
    instance.zoomControl.setPosition('topright')
    L.control
      .scale({ imperial: false, position: 'topright', maxWidth: 140 })
      .addTo(instance)
    L.tileLayer(SATELLITE_TILE_URL, {
      maxZoom: 19,
      attribution:
        'Imagery &copy; Esri, Maxar, Earthstar Geographics, GIS User Community',
    }).addTo(instance)
    track.current = L.polyline([], {
      color: 'transparent',
      weight: 0,
      opacity: 0,
    }).addTo(instance)
    targetLine.current = L.polyline([], {
      color: '#60a5fa',
      dashArray: '10 8',
      opacity: 0.95,
      weight: 2,
    }).addTo(instance)
    map.current = instance
    return () => {
      if (droneAnimationFrame.current !== null)
        window.cancelAnimationFrame(droneAnimationFrame.current)
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
}
