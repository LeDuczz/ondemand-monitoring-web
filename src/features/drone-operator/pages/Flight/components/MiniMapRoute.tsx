import { useI18n } from '../../../../../shared/i18n'
import type { MissionRoutePoint } from '../../../types/omss'
import { miniMapRouteMessages } from './MiniMapRoute.messages'

export type MiniMapScreenPoint = MissionRoutePoint & { x: number; y: number }

export function MiniMapRoute({
  routeScreenPoints,
  routePath,
  viewX,
  viewY,
  viewWidth,
  viewHeight,
  zoom,
}: {
  routeScreenPoints: MiniMapScreenPoint[]
  routePath: string
  viewX: number
  viewY: number
  viewWidth: number
  viewHeight: number
  zoom: number
}) {
  const { t } = useI18n(miniMapRouteMessages)
  return (
    <>
      {routeScreenPoints.length > 1 && (
        <g>
          <path
            d={routePath}
            fill="none"
            stroke="rgba(2,6,23,.75)"
            strokeWidth={5.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d={routePath}
            fill="none"
            stroke="rgba(34,211,238,.96)"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="6 3"
          />
          <text
            x={viewX + viewWidth - 8 / zoom}
            y={viewY + viewHeight - 10 / zoom}
            fill="#cffafe"
            fontSize={8 / zoom}
            fontWeight="900"
            textAnchor="end"
            paintOrder="stroke"
            stroke="rgba(15,23,42,.9)"
            strokeWidth={2 / zoom}
          >
            {t.flightPlan(routeScreenPoints.length)}
          </text>
        </g>
      )}
      {routeScreenPoints.map((point) => {
        const reason = point.reason?.toUpperCase()
        const isTarget = reason === 'TARGET' || reason === 'ORDER'
        const isStart = reason === 'START' || point.sequence === 0
        return (
          <g key={point.id} transform={`translate(${point.x} ${point.y})`}>
            <circle
              r={isTarget ? 5.5 : isStart ? 5 : 4}
              fill={isTarget ? '#ef4444' : isStart ? '#60a5fa' : '#fbbf24'}
              stroke="#fff7ed"
              strokeWidth="1"
            />
            <text
              x={7}
              y={3}
              fill="#fef3c7"
              fontSize="7"
              fontWeight="900"
              paintOrder="stroke"
              stroke="rgba(15,23,42,.85)"
              strokeWidth="2"
            >
              {point.sequence}
            </text>
          </g>
        )
      })}
    </>
  )
}
