import type { MouseEvent } from 'react'

import { useI18n } from '../../../../../shared/i18n'
import {
  simulationMapAspectRatio,
  simulationMapImageStyle,
} from '../../../../../shared/lib/simulationMapProjection'
import {
  MAP_IMAGE_CROP,
  SIM_RADIUS_SCALE,
  simPointToPercent,
} from '../../../lib/createOrder/geometry'
import { clamp } from '../../../lib/createOrder/format'
import type {
  MapPoint,
  SimulationMapMeta,
  SimulationZone,
} from '../../../lib/createOrder/types'
import { simulationMapMessages } from './SimulationMap.messages'

type Props = {
  imageUrl: string
  meta: SimulationMapMeta | null
  zones: SimulationZone[]
  blockedZoneIds: Set<string>
  point: MapPoint
  radiusM: number
  hasError: boolean
  onPick: (percent: MapPoint) => void
}

/** Clickable top-down map with restricted zones and the radius circle. */
export function SimulationMap(props: Props) {
  const { t } = useI18n(simulationMapMessages)
  const { point } = props
  const radiusPx = clamp(props.radiusM / SIM_RADIUS_SCALE, 34, 145)

  function handleClick(event: MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    props.onPick({
      x: clamp(((event.clientX - rect.left) / rect.width) * 100, 0, 100),
      y: clamp(((event.clientY - rect.top) / rect.height) * 100, 0, 100),
    })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={t.mapLabel}
      className={`co-map${props.hasError ? ' has-error' : ''}`}
      style={{ aspectRatio: simulationMapAspectRatio(MAP_IMAGE_CROP) }}
      onClick={handleClick}
    >
      <div className="co-map-layer">
        <img
          className="co-map-img"
          alt={t.imageAlt}
          src={props.imageUrl}
          style={simulationMapImageStyle(MAP_IMAGE_CROP)}
        />
        {props.meta &&
          props.zones
            .filter((zone) => zone.restricted)
            .map((zone) => {
              const clip = zone.coordinates
                .map((p) => simPointToPercent(p, props.meta!))
                .map((p) => `${p.x}% ${p.y}%`)
                .join(', ')
              return (
                <div
                  key={zone.id}
                  title={zone.name}
                  className={`co-map-zone${props.blockedZoneIds.has(zone.id) ? ' is-blocked' : ''}`}
                  style={{ clipPath: `polygon(${clip})` }}
                />
              )
            })}
      </div>
      <div
        className="co-map-circle"
        style={{
          left: `${point.x}%`,
          top: `${point.y}%`,
          width: radiusPx * 2,
          height: radiusPx * 2,
        }}
      />
      <div
        className="co-map-dot"
        style={{ left: `${point.x}%`, top: `${point.y}%` }}
      />
      <div className="co-map-legend">
        <span className="co-map-legend-swatch" />
        {t.restrictedZoneLegend}
      </div>
    </div>
  )
}
