import { simulationMapAspectRatio } from '../../../../../shared/lib/simulationMapProjection'
import { SIMULATION_MAP_IMAGE_CROP } from '../liveDispatchHelpers'
import type { Mission } from '../../../../mission/types/mission'
import { useI18n } from '../../../../../shared/i18n'
import { orderMapPreviewMessages } from './OrderMapPreview.messages'

export function OrderMapPreview({
  mapImageUrl,
  imageStyle,
  target,
  current,
}: {
  mapImageUrl: string
  imageStyle: { left: string; top: string; width: string; height: string }
  target: { x: number; y: number }
  current: Mission
}) {
  const { t } = useI18n(orderMapPreviewMessages)
  return (
    <div
      className="odm-or-map odm-or-map-compact"
      style={{
        aspectRatio: simulationMapAspectRatio(SIMULATION_MAP_IMAGE_CROP),
      }}
    >
      <div
        className="odm-or-map-layer"
        style={{ left: 0, top: 0, width: '100%', height: '100%' }}
      >
        <img
          className="odm-or-map-image"
          src={mapImageUrl}
          alt=""
          style={imageStyle}
        />
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          role="img"
          aria-label={t.mapAriaLabel}
        >
          <circle
            cx={target.x}
            cy={target.y}
            r="14"
            className="odm-or-map-radius"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <span
          className="odm-or-map-pin"
          style={{ left: `${target.x}%`, top: `${target.y}%` }}
          aria-hidden="true"
        >
          <svg width="26" height="33" viewBox="0 0 30 38">
            <path
              d="M15 37C15 37 3 24.5 3 14.5a12 12 0 0 1 24 0C27 24.5 15 37 15 37z"
              fill="var(--ui-primary)"
              stroke="var(--ui-surface)"
              strokeWidth="2"
            />
            <circle cx="15" cy="14.5" r="4.5" fill="var(--ui-surface)" />
          </svg>
        </span>
        <span
          className="odm-or-map-badge"
          style={{ left: `${target.x}%`, top: `${target.y}%` }}
        >
          X {current.longitude?.toFixed(1) ?? '—'} · Y{' '}
          {current.latitude?.toFixed(1) ?? '—'}
        </span>
      </div>
    </div>
  )
}
