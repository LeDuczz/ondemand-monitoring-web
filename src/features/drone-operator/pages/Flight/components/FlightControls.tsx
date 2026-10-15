import { memo } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { maySendFlightCommand } from '../../../../mission/lib/missionOperationalState'
import type {
  ControlStatus,
  FlightCommand,
  WeatherPreset,
} from '../inFlightTypes'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { CameraToolsGroup } from './CameraToolsGroup'
import { FlightControlButton } from './FlightControlButton'
import type { FlightControlItem } from './flightControlItems'
import { flightControlsMessages } from './FlightControls.messages'
import { GlassPanel } from './GlassPanel'
import { ManualControlGroup } from './ManualControlGroup'
import { QuickActionsGroup } from './QuickActionsGroup'

export const FlightControls = memo(function FlightControls({
  canFly,
  canTerminate,
  busyCommand,
  lidarDetailsOpen,
  moreOpen,
  status,
  onCommand,
  onWeatherPreset,
  onToggleMore,
  onReviewMedia,
  onFinishFlight,
  finishFlightBusy,
  onReferenceCapture,
  referenceBusy,
}: {
  canFly: boolean
  canTerminate: boolean
  referenceBusy?: boolean
  onReferenceCapture?: () => void
  onFinishFlight?: () => void
  finishFlightBusy?: boolean
  busyCommand: FlightCommand | null
  lidarDetailsOpen: boolean
  moreOpen: boolean
  status: ControlStatus | null
  onCommand: (command: FlightCommand) => void
  onWeatherPreset: (preset: WeatherPreset) => void
  onToggleMore: () => void
  onReviewMedia?: () => void
}) {
  useRenderDiagnostics('FlightControls')
  const { t } = useI18n(flightControlsMessages)
  const thermalEnabled = status?.thermalEnabled === true
  const thermalLabel = thermalEnabled ? t.thermalOn : t.thermalOff
  const commandDisabled = (command: FlightCommand) =>
    busyCommand !== null || !maySendFlightCommand(command, canFly, canTerminate)
  const controlButton = (item: FlightControlItem) => {
    const isThermal = item.command === 'thermal_toggle'
    const isLidar = item.command === 'lidar_monitor_toggle'
    const label = isThermal
      ? thermalEnabled
        ? t.thermalOn
        : t.thermalOff
      : isLidar
        ? `${t.controls.lidar} ${lidarDetailsOpen ? 'VIEW' : 'UI'}`
        : t.controls[item.labelKey]
    return (
      <FlightControlButton
        key={`${item.command}-${item.labelKey}`}
        icon={item.icon}
        label={label}
        tone={
          (isThermal && thermalEnabled) || (isLidar && lidarDetailsOpen)
            ? 'amber'
            : item.tone
        }
        busy={busyCommand === item.command}
        sendingLabel={t.sending}
        disabled={commandDisabled(item.command)}
        onClick={() => onCommand(item.command)}
      />
    )
  }

  return (
    <GlassPanel
      style={{
        display: 'grid',
        gridTemplateColumns:
          'minmax(220px, .8fr) minmax(340px, 1.25fr) minmax(280px, 1fr)',
        alignItems: 'stretch',
        gap: 8,
        padding: 8,
        width: '100%',
        overflow: 'visible',
      }}
    >
      <QuickActionsGroup
        renderControl={controlButton}
        commandDisabled={commandDisabled}
        onCommand={onCommand}
      />
      <ManualControlGroup
        labels={t.controls}
        sendingLabel={t.sending}
        busyCommand={busyCommand}
        commandDisabled={commandDisabled}
        onCommand={onCommand}
      />
      <CameraToolsGroup
        canFly={canFly}
        busyCommand={busyCommand}
        moreOpen={moreOpen}
        thermalEnabled={thermalEnabled}
        thermalLabel={thermalLabel}
        sendingLabel={t.sending}
        finishFlightBusy={finishFlightBusy}
        referenceBusy={referenceBusy}
        renderControl={controlButton}
        commandDisabled={commandDisabled}
        onCommand={onCommand}
        onWeatherPreset={onWeatherPreset}
        onToggleMore={onToggleMore}
        onReviewMedia={onReviewMedia}
        onReferenceCapture={onReferenceCapture}
        onFinishFlight={onFinishFlight}
      />
    </GlassPanel>
  )
})
