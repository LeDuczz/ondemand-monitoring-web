import type { Drone, Mission } from '../../../types/omss'
import type { useGeofence } from '../useGeofence'
import type {
  ControlStatus,
  FlightCommand,
  WeatherPreset,
} from '../inFlightTypes'
import { AirPressurePanel } from './AirPressurePanel'
import { FlightControls } from './FlightControls'
import { LidarRadarOverlay } from './LidarRadarOverlay'
import { ManualCockpitPreflight } from './ManualCockpitPreflight'
import { MissionControlCamera } from './MissionControlCamera'
import { MissionControlFooter } from './MissionControlFooter'
import { MissionControlHeader } from './MissionControlHeader'
import { MissionControlSide } from './MissionControlSide'

export function MissionControlDashboard({
  mission,
  drone,
  controlStatus,
  isOnline,
  progress,
  elapsed,
  remaining,
  streamUrl,
  preflightReady,
  normalFlightAllowed,
  terminationAllowed,
  busyCommand,
  lidarDetailsOpen,
  moreOpen,
  finishFlightBusy,
  referenceBusy,
  statusMessage,
  showBatteryWarning,
  batteryState,
  batteryDisplay,
  geofence,
  onOnline,
  onOffline,
  onCommand,
  onWeatherPreset,
  onToggleMore,
  onReviewMedia,
  onFinishFlight,
  onReferenceCapture,
  onPreflightReady,
}: {
  mission: Mission
  drone: Drone
  controlStatus: ControlStatus | null
  isOnline: boolean
  progress: number
  elapsed: number
  remaining: number
  streamUrl: string
  preflightReady: boolean
  normalFlightAllowed: boolean
  terminationAllowed: boolean
  busyCommand: FlightCommand | null
  lidarDetailsOpen: boolean
  moreOpen: boolean
  finishFlightBusy: boolean
  referenceBusy: boolean
  statusMessage: string
  showBatteryWarning: boolean
  batteryState: NonNullable<ControlStatus['batteryState']>
  batteryDisplay: string
  geofence: ReturnType<typeof useGeofence>
  onOnline: () => void
  onOffline: () => void
  onCommand: (command: FlightCommand) => void
  onWeatherPreset: (preset: WeatherPreset) => void
  onToggleMore: () => void
  onReviewMedia: () => void
  onFinishFlight: () => void
  onReferenceCapture: () => void
  onPreflightReady: () => void | Promise<void>
}) {
  return (
    <div
      className="mission-control-root"
      style={{
        flex: 1,
        minHeight: '100vh',
        height: '100vh',
        display: 'grid',
        gridTemplateRows: '76px 1fr 42px',
        background: '#020617',
        color: '#e5edf8',
        overflow: 'hidden',
        colorScheme: 'dark',
      }}
    >
      <MissionControlHeader
        drone={drone}
        isOnline={isOnline}
        progress={progress}
        elapsed={elapsed}
        remaining={remaining}
      />

      <main
        className="mission-control-workspace"
        style={{
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1.45fr) minmax(360px, 0.74fr) minmax(280px, 0.62fr)',
          gridTemplateRows: 'minmax(350px, 1fr) auto',
          alignItems: 'stretch',
          gap: 12,
          padding: '10px 14px 10px',
          background:
            'radial-gradient(circle at 28% 10%, rgba(37, 99, 235, 0.12), transparent 34%), #020617',
        }}
      >
        <MissionControlCamera
          streamUrl={streamUrl}
          preflightReady={preflightReady}
          isOnline={isOnline}
          onOnline={onOnline}
          onOffline={onOffline}
          controlStatus={controlStatus}
          thermalEnabled={controlStatus?.thermalEnabled === true}
          showBatteryWarning={showBatteryWarning}
          batteryState={batteryState}
          batteryDisplay={batteryDisplay}
          geofence={geofence}
          statusMessage={statusMessage}
        />

        <section
          className="mission-control-lidar"
          style={{
            minWidth: 0,
            minHeight: 0,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 8,
            overflowX: 'hidden',
            overflowY: 'auto',
            paddingRight: 2,
            scrollbarGutter: 'stable',
          }}
        >
          <LidarRadarOverlay status={controlStatus} />
          <AirPressurePanel status={controlStatus} />
        </section>

        <section
          className="mission-control-controls"
          style={{
            gridColumn: '1 / 3',
            minWidth: 0,
            overflow: 'visible',
          }}
        >
          <FlightControls
            canFly={normalFlightAllowed && preflightReady}
            canTerminate={terminationAllowed}
            busyCommand={busyCommand}
            lidarDetailsOpen={lidarDetailsOpen}
            moreOpen={moreOpen}
            status={controlStatus}
            onCommand={onCommand}
            onWeatherPreset={onWeatherPreset}
            onToggleMore={onToggleMore}
            onReviewMedia={onReviewMedia}
            onFinishFlight={onFinishFlight}
            finishFlightBusy={finishFlightBusy}
            onReferenceCapture={onReferenceCapture}
            referenceBusy={referenceBusy}
          />
        </section>

        <MissionControlSide
          controlStatus={controlStatus}
          lidarDetailsOpen={lidarDetailsOpen}
          progress={progress}
          mission={mission}
        />

        {!preflightReady && normalFlightAllowed && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              background: '#f1f5f9',
              overflow: 'auto',
              padding: 22,
            }}
          >
            <ManualCockpitPreflight
              missionLabel={mission.id}
              deviceLabel={drone.name || drone.id}
              onReady={onPreflightReady}
            />
          </div>
        )}
      </main>

      <MissionControlFooter
        mission={mission}
        geofenceMessage={geofence.geofenceMessage}
        footerStatusColor={geofence.footerStatusColor}
        footerStatusDot={geofence.footerStatusDot}
      />
    </div>
  )
}
