import { type ReactNode } from 'react'
import './FlightCockpit.css'
import { useCockpitLayout, useFlightClock } from './cockpitHooks'
import type {
  BatteryTone,
  CockpitCommand,
  CockpitTelemetry,
} from './cockpitTypes'
import { CockpitCameraPanel } from './CockpitCameraPanel'
import { CockpitControlsPanel } from './CockpitControlsPanel'
import { CockpitHeader } from './CockpitHeader'
import { CockpitMapPanel } from './CockpitMapPanel'
import { CockpitTelemetryPanel } from './CockpitTelemetryPanel'

export type { CockpitCommand, CockpitTelemetry }

type Props = {
  /** Kept for API compatibility; texts follow the global i18n language. */
  language: 'vi' | 'en'
  missionLabel: string
  roleLabel: string
  liveLabel: string
  online: boolean
  waitingGpsLabel: string
  statusMessage: string
  telemetry: CockpitTelemetry
  camera: ReactNode
  map: ReactNode
  overlay?: ReactNode
  busy: boolean
  canFly: boolean
  canTerminate?: boolean
  canFlyToTarget: boolean
  /** @deprecated reference-photo button was removed; the Photo control captures instead */
  referenceBusy?: boolean
  onCommand: (command: CockpitCommand) => void
  onReview: () => void
  onFinishFlight?: () => void
  finishingFlight?: boolean
  onReferenceCapture?: () => void
}

export function FlightCockpit(props: Props) {
  const {
    missionLabel,
    roleLabel,
    liveLabel,
    online,
    waitingGpsLabel,
    statusMessage,
    telemetry: tm,
    camera,
    map,
    overlay,
    busy,
    canFly,
    canFlyToTarget,
    canTerminate = false,
    onCommand,
    onReview,
    onFinishFlight,
    finishingFlight,
  } = props
  const clock = useFlightClock(tm.inAir)
  const [layout, setLayout] = useCockpitLayout()

  const battery = tm.batteryPercent
  const batteryTone: BatteryTone =
    battery === null
      ? 'ok'
      : battery <= 20
        ? 'low'
        : battery <= 40
          ? 'mid'
          : 'ok'
  const hasGps = tm.latitude !== null && tm.longitude !== null
  const gpsText = hasGps
    ? `${tm.latitude!.toFixed(6)}, ${tm.longitude!.toFixed(6)}`
    : waitingGpsLabel

  return (
    <div className="fc-root">
      <CockpitHeader
        missionLabel={missionLabel}
        roleLabel={roleLabel}
        liveLabel={liveLabel}
        online={online}
        clock={clock}
        battery={battery}
        batteryTone={batteryTone}
        gpsText={gpsText}
        layout={layout}
        onLayoutChange={setLayout}
        busy={busy}
        onReview={onReview}
      />

      <main className={`fc-body is-layout-${layout}`}>
        <CockpitCameraPanel
          camera={camera}
          battery={battery}
          batteryTone={batteryTone}
          layout={layout}
          onLayoutChange={setLayout}
        />

        <CockpitMapPanel
          map={map}
          missionLabel={missionLabel}
          statusMessage={statusMessage}
          layout={layout}
          onLayoutChange={setLayout}
        />

        <aside className="fc-side">
          <CockpitTelemetryPanel
            tm={tm}
            battery={battery}
            batteryTone={batteryTone}
          />

          <CockpitControlsPanel
            busy={busy}
            canFly={canFly}
            canTerminate={canTerminate}
            canFlyToTarget={canFlyToTarget}
            onCommand={onCommand}
            onFinishFlight={onFinishFlight}
            finishingFlight={finishingFlight}
          />
        </aside>
      </main>
      {overlay}
    </div>
  )
}
