import { useEffect } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { satelliteFlightMapMessages } from './SatelliteFlightMap.messages'
import type { GpsPosition } from './satelliteMapHelpers'
import { useDroneMarker } from './useDroneMarker'
import { useRestrictedZones } from './useRestrictedZones'
import { useSatelliteMapInstance } from './useSatelliteMapInstance'
import { useSatelliteMapRefs } from './useSatelliteMapRefs'
import { useTargetMarker } from './useTargetMarker'

type Props = {
  missionId: string
  target: { latitude: number; longitude: number } | null
  drone: GpsPosition | null
}

export function SatelliteFlightMap({ missionId, target, drone }: Props) {
  const { t } = useI18n(satelliteFlightMapMessages)
  const refs = useSatelliteMapRefs()
  const {
    container,
    track,
    targetLine,
    displayedDronePoint,
    droneAnimationFrame,
    trackPoints,
    centeredOnDrone,
  } = refs

  useSatelliteMapInstance(refs)
  useRestrictedZones(refs)

  useEffect(() => {
    if (droneAnimationFrame.current !== null)
      window.cancelAnimationFrame(droneAnimationFrame.current)
    droneAnimationFrame.current = null
    displayedDronePoint.current = null
    trackPoints.current = []
    track.current?.setLatLngs([])
    targetLine.current?.setLatLngs([])
    centeredOnDrone.current = false
  }, [missionId])

  useTargetMarker(refs, target)
  useDroneMarker(refs, drone, target)

  return (
    <div
      ref={container}
      className="satellite-flight-map"
      role="application"
      aria-label={t.ariaLabel}
    />
  )
}
