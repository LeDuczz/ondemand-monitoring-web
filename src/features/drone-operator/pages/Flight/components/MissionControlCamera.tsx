import type { useGeofence } from '../useGeofence'
import type { ControlStatus } from '../inFlightTypes'
import { BatteryWarningBanner } from './BatteryWarningBanner'
import { CameraFeed } from './CameraFeed'
import { CameraStatusPanel } from './CameraStatusPanel'
import { GeofenceBanner } from './GeofenceBanner'
import { GlassPanel } from './GlassPanel'
import { Icon } from './Icon'
import { ThermalPanel } from './ThermalPanel'

export function MissionControlCamera({
  streamUrl,
  preflightReady,
  isOnline,
  onOnline,
  onOffline,
  controlStatus,
  thermalEnabled,
  showBatteryWarning,
  batteryState,
  batteryDisplay,
  geofence,
  statusMessage,
}: {
  streamUrl: string
  preflightReady: boolean
  isOnline: boolean
  onOnline: () => void
  onOffline: () => void
  controlStatus: ControlStatus | null
  thermalEnabled: boolean
  showBatteryWarning: boolean
  batteryState: NonNullable<ControlStatus['batteryState']>
  batteryDisplay: string
  geofence: ReturnType<typeof useGeofence>
  statusMessage: string
}) {
  return (
    <section
      className="mission-control-primary"
      style={{
        minWidth: 0,
        minHeight: 0,
        height: '100%',
        display: 'grid',
      }}
    >
      <div
        className="mission-control-camera-card"
        style={{
          position: 'relative',
          minWidth: 0,
          minHeight: 350,
          height: '100%',
          overflow: 'hidden',
          borderRadius: 10,
          border: '1px solid rgba(59, 130, 246, 0.32)',
          background: '#020617',
          boxShadow: '0 18px 45px rgba(0, 0, 0, 0.24)',
        }}
      >
        <CameraFeed
          streamUrl={streamUrl}
          preflightReady={preflightReady}
          isOnline={isOnline}
          onOnline={onOnline}
          onOffline={onOffline}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background:
              'radial-gradient(circle at center, transparent 0 42%, rgba(2,6,23,.08) 72%, rgba(2,6,23,.34) 100%)',
          }}
        />

        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: 78,
            height: 78,
            transform: 'translate(-50%,-50%)',
            color: 'rgba(226,232,240,.68)',
            pointerEvents: 'none',
          }}
        >
          <Icon name="crosshair" size={78} />
        </div>

        <CameraStatusPanel status={controlStatus} />

        {thermalEnabled && <ThermalPanel controlStatus={controlStatus} />}

        {showBatteryWarning && (
          <BatteryWarningBanner
            batteryState={batteryState}
            batteryDisplay={batteryDisplay}
            geofenceAlertActive={geofence.geofenceAlertActive}
          />
        )}

        <GlassPanel
          style={{
            position: 'absolute',
            right: 14,
            bottom: 14,
            padding: '7px 11px',
            color: '#cbd5e1',
            fontSize: 11,
          }}
        >
          {statusMessage}
        </GlassPanel>

        {geofence.geofenceAlertActive && (
          <GeofenceBanner
            geofenceLevel={geofence.geofenceStatus.level}
            geofenceTone={geofence.geofenceTone}
            geofenceMessage={geofence.geofenceMessage}
          />
        )}
      </div>
    </section>
  )
}
