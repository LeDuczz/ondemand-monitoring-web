import { memo, useState } from 'react'
import { env } from '../../../../../config/env'
import {
  SIMULATION_MAP_DEFAULT_CROP,
  worldToViewportPercent,
} from '../../../../../shared/lib/simulationMapProjection'
import type { Mission } from '../../../types/omss'
import { statusToSimulationPoint } from '../geofence'
import type { ControlStatus } from '../inFlightTypes'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { useSimulationMap } from '../useSimulationMap'
import { GlassPanel } from './GlassPanel'
import { MiniMapMarkers } from './MiniMapMarkers'
import { MiniMapRoute } from './MiniMapRoute'
import { MiniMapToolbar } from './MiniMapToolbar'

export const RealMiniMap = memo(function RealMiniMap({
  status,
  mission,
}: {
  status: ControlStatus | null
  mission: Mission
}) {
  useRenderDiagnostics('MiniMap')
  const { meta } = useSimulationMap()
  const [zoom, setZoom] = useState(1)
  const [follow, setFollow] = useState(false)
  const width = 320
  const height = 190

  const worldToMinimap = (x: number, y: number) => {
    if (!meta) return [width / 2, height / 2] as const
    const point = worldToViewportPercent(
      { simX: x, simY: y },
      meta,
      SIMULATION_MAP_DEFAULT_CROP,
    )
    const px = (point.x / 100) * width
    const py = (point.y / 100) * height
    return [px, py] as const
  }

  const simPoint = statusToSimulationPoint(status)
  const droneWorld = simPoint
    ? { x: simPoint[0], y: simPoint[1] }
    : { x: 0, y: 0 }
  const [droneX, droneY] = worldToMinimap(droneWorld.x, droneWorld.y)
  const routePoints = mission.routePoints ?? []
  const routeScreenPoints = routePoints.map((point) => {
    const [x, y] = worldToMinimap(point.simX, point.simY)
    return { ...point, x, y }
  })
  const routePath = routeScreenPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ')
  const routeTargetPoint =
    routeScreenPoints.find((point) =>
      ['TARGET', 'ORDER'].includes(point.reason?.toUpperCase()),
    ) ?? routeScreenPoints[routeScreenPoints.length - 1]
  const orderTargetPoint =
    typeof mission.targetSimX === 'number' &&
    typeof mission.targetSimY === 'number'
      ? (() => {
          const [x, y] = worldToMinimap(mission.targetSimX, mission.targetSimY)
          return { x, y }
        })()
      : null
  const missionTargetPoint = routeTargetPoint ?? orderTargetPoint
  const viewWidth = width / zoom
  const viewHeight = height / zoom
  const viewX = follow
    ? Math.max(0, Math.min(width - viewWidth, droneX - viewWidth / 2))
    : (width - viewWidth) / 2
  const viewY = follow
    ? Math.max(0, Math.min(height - viewHeight, droneY - viewHeight / 2))
    : (height - viewHeight) / 2
  const yaw = status?.yawDeg ?? 0
  const mapImagePath =
    meta?.image ?? '/simulation-viewer/simulation_map_top.png'
  const mapImageVersion = meta?.imageVersion
    ? `?v=${encodeURIComponent(meta.imageVersion)}`
    : ''
  const mapImageUrl = `${env.apiBaseUrl}${mapImagePath}${mapImageVersion}`
  const crop = SIMULATION_MAP_DEFAULT_CROP
  const visibleMapWidth = 100 - crop.left - crop.right
  const visibleMapHeight = 100 - crop.top - crop.bottom
  const mapX = -(crop.left / visibleMapWidth) * width
  const mapY = -(crop.top / visibleMapHeight) * height
  const mapWidth = (100 / visibleMapWidth) * width
  const mapHeight = (100 / visibleMapHeight) * height

  return (
    <GlassPanel style={{ width: '100%', overflow: 'hidden', flexShrink: 0 }}>
      <MiniMapToolbar
        follow={follow}
        onToggleFollow={() => setFollow((value) => !value)}
        onZoomOut={() =>
          setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))
        }
        onZoomIn={() =>
          setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))
        }
      />
      <svg
        className="mission-control-map"
        viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', background: 'rgba(15,23,42,.55)' }}
      >
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="rgba(15,23,42,.55)"
        />
        <image
          href={mapImageUrl}
          x={mapX}
          y={mapY}
          width={mapWidth}
          height={mapHeight}
          preserveAspectRatio="xMidYMid slice"
          opacity=".92"
        />
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="rgba(2,6,23,.14)"
        />
        <MiniMapRoute
          routeScreenPoints={routeScreenPoints}
          routePath={routePath}
          viewX={viewX}
          viewY={viewY}
          viewWidth={viewWidth}
          viewHeight={viewHeight}
          zoom={zoom}
        />
        <MiniMapMarkers
          missionTargetPoint={missionTargetPoint}
          droneX={droneX}
          droneY={droneY}
          yaw={yaw}
          viewX={viewX}
          viewY={viewY}
          zoom={zoom}
        />
      </svg>
    </GlassPanel>
  )
})
