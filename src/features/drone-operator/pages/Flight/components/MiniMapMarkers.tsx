import { useI18n } from '../../../../../shared/i18n'
import { miniMapMarkersMessages } from './MiniMapMarkers.messages'

export function MiniMapMarkers({
  missionTargetPoint,
  droneX,
  droneY,
  yaw,
  viewX,
  viewY,
  zoom,
}: {
  missionTargetPoint: { x: number; y: number } | null | undefined
  droneX: number
  droneY: number
  yaw: number
  viewX: number
  viewY: number
  zoom: number
}) {
  const { t } = useI18n(miniMapMarkersMessages)
  return (
    <>
      {missionTargetPoint && (
        <g
          transform={`translate(${missionTargetPoint.x} ${missionTargetPoint.y})`}
        >
          <circle
            r="13"
            fill="rgba(239,68,68,.22)"
            stroke="rgba(254,202,202,.85)"
            strokeWidth="1.5"
          />
          <circle r="6" fill="#ef4444" stroke="#ffffff" strokeWidth="2" />
          <path
            d="M0 -19 L4 -10 L-4 -10 Z"
            fill="#ef4444"
            stroke="#ffffff"
            strokeWidth="1"
          />
          <text
            x="10"
            y="-10"
            fill="#fee2e2"
            fontSize="8"
            fontWeight="900"
            paintOrder="stroke"
            stroke="rgba(15,23,42,.9)"
            strokeWidth="2"
          >
            {t.order}
          </text>
        </g>
      )}
      <g transform={`translate(${droneX} ${droneY}) rotate(${yaw})`}>
        <circle
          cx="0"
          cy="0"
          r="8"
          fill="rgba(96,165,250,.24)"
          stroke="rgba(191,219,254,.8)"
          strokeWidth="1"
        />
        <path
          d="M0 -9 L6 7 L0 4 L-6 7 Z"
          fill="#60a5fa"
          stroke="#eff6ff"
          strokeWidth="1"
        />
      </g>
      <text
        x={viewX + 8 / zoom}
        y={viewY + 13 / zoom}
        fill="#e5edf8"
        fontSize={9 / zoom}
        fontWeight="800"
      >
        {t.north}
      </text>
      <path
        d={`M${viewX + 10 / zoom} ${viewY + 24 / zoom}v-8`}
        stroke="#e5edf8"
        strokeWidth={1.5 / zoom}
        strokeLinecap="round"
      />
    </>
  )
}
