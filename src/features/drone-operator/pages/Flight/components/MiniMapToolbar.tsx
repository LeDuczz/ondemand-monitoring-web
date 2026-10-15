import { useI18n } from '../../../../../shared/i18n'
import { Icon } from './Icon'
import { miniMapToolbarMessages } from './MiniMapToolbar.messages'

export function MiniMapToolbar({
  follow,
  onToggleFollow,
  onZoomOut,
  onZoomIn,
}: {
  follow: boolean
  onToggleFollow: () => void
  onZoomOut: () => void
  onZoomIn: () => void
}) {
  const { t } = useI18n(miniMapToolbarMessages)
  return (
    <div
      style={{
        height: 34,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 12px',
        borderBottom: '1px solid rgba(148,163,184,.16)',
        color: '#cbd5e1',
        fontSize: 12,
        fontWeight: 900,
      }}
    >
      <button
        onClick={onToggleFollow}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          border: 0,
          background: 'transparent',
          color: follow ? '#93c5fd' : '#cbd5e1',
          fontSize: 11,
          fontWeight: 800,
          cursor: 'pointer',
        }}
      >
        <Icon name="map" size={14} /> {t.title}
      </button>
      <span style={{ display: 'flex', gap: 5 }}>
        <button
          onClick={onZoomOut}
          style={{
            border: 0,
            background: 'transparent',
            color: '#cbd5e1',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
          title={t.zoomOut}
        >
          <Icon name="minus" size={12} />
        </button>
        <button
          onClick={onZoomIn}
          style={{
            border: 0,
            background: 'transparent',
            color: '#cbd5e1',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
          title={t.zoomIn}
        >
          <Icon name="plus" size={12} />
        </button>
      </span>
    </div>
  )
}
