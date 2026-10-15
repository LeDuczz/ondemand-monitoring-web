import { memo } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { cameraFeedMessages } from './CameraFeed.messages'
import { GlassPanel } from './GlassPanel'

export const CameraFeed = memo(function CameraFeed({
  streamUrl,
  preflightReady,
  isOnline,
  onOnline,
  onOffline,
}: {
  streamUrl: string
  preflightReady: boolean
  isOnline: boolean
  onOnline: () => void
  onOffline: () => void
}) {
  useRenderDiagnostics('CameraFeed')
  const { t } = useI18n(cameraFeedMessages)
  return (
    <>
      <img
        src={streamUrl}
        alt={t.alt}
        onLoad={onOnline}
        onError={onOffline}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          display: 'block',
          background: '#020617',
        }}
      />
      {!isOnline && preflightReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(2,6,23,.72)',
          }}
        >
          <GlassPanel style={{ padding: '18px 22px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: '#e5edf8',
                marginBottom: 7,
              }}
            >
              {t.offlineTitle}
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              {t.offlineBody}
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  )
})
