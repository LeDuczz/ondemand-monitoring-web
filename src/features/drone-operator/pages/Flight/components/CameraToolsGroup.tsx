import type { ReactNode } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import type { FlightCommand, WeatherPreset } from '../inFlightTypes'
import { cameraToolsGroupMessages } from './CameraToolsGroup.messages'
import { moreToolControls, type FlightControlItem } from './flightControlItems'
import { buttonStyle, toolbarGroupStyle } from './flightControlStyles'
import { GlassPanel } from './GlassPanel'
import { Icon } from './Icon'

type WeatherText = (typeof cameraToolsGroupMessages)['vi']['weather']

const weatherControls: {
  preset: WeatherPreset
  labelKey: keyof WeatherText
  tone?: 'danger' | 'amber'
}[] = [
  { preset: 'CLEAR_DAY', labelKey: 'clear' },
  { preset: 'CLOUDY', labelKey: 'cloud' },
  { preset: 'FOGGY', labelKey: 'fog', tone: 'amber' },
  { preset: 'WINDY', labelKey: 'wind', tone: 'amber' },
  { preset: 'LIGHT_RAIN', labelKey: 'rain', tone: 'amber' },
  { preset: 'HEAVY_RAIN', labelKey: 'heavy', tone: 'danger' },
]

export function CameraToolsGroup({
  canFly,
  busyCommand,
  moreOpen,
  thermalEnabled,
  thermalLabel,
  sendingLabel,
  finishFlightBusy,
  referenceBusy,
  renderControl,
  commandDisabled,
  onCommand,
  onWeatherPreset,
  onToggleMore,
  onReviewMedia,
  onReferenceCapture,
  onFinishFlight,
}: {
  canFly: boolean
  busyCommand: FlightCommand | null
  moreOpen: boolean
  thermalEnabled: boolean
  thermalLabel: string
  sendingLabel: string
  finishFlightBusy?: boolean
  referenceBusy?: boolean
  renderControl: (item: FlightControlItem) => ReactNode
  commandDisabled: (command: FlightCommand) => boolean
  onCommand: (command: FlightCommand) => void
  onWeatherPreset: (preset: WeatherPreset) => void
  onToggleMore: () => void
  onReviewMedia?: () => void
  onReferenceCapture?: () => void
  onFinishFlight?: () => void
}) {
  const { t } = useI18n(cameraToolsGroupMessages)
  return (
    <div
      style={{
        ...toolbarGroupStyle,
        alignContent: 'center',
        position: 'relative',
      }}
    >
      <div
        style={{
          width: '100%',
          color: '#94a3b8',
          fontSize: 10,
          fontWeight: 850,
          marginBottom: 2,
        }}
      >
        {t.cameraTools}
      </div>
      {onReviewMedia && (
        <button
          onClick={onReviewMedia}
          disabled={busyCommand !== null}
          style={{ ...buttonStyle(), width: 62 }}
          title={t.reviewMedia}
        >
          <Icon name="photo" size={14} />
          <span>{t.review}</span>
        </button>
      )}
      {onReferenceCapture && (
        <button
          onClick={onReferenceCapture}
          disabled={!canFly || busyCommand !== null || referenceBusy}
          style={{ ...buttonStyle(), width: 62 }}
          title={t.referenceTitle}
        >
          <Icon name="photo" size={14} />
          <span>{referenceBusy ? t.referenceFetching : t.referencePhoto}</span>
        </button>
      )}
      {onFinishFlight && (
        <button
          onClick={onFinishFlight}
          disabled={commandDisabled('return_to_base') || finishFlightBusy}
          style={{
            ...buttonStyle(),
            width: 86,
            background: 'rgba(20,83,45,.82)',
            color: '#86efac',
          }}
          title={t.finishFlightTitle}
        >
          <Icon name="check" size={14} />
          <span>{finishFlightBusy ? sendingLabel : t.finishFlight}</span>
        </button>
      )}
      <button
        onClick={() => onCommand('thermal_toggle')}
        disabled={commandDisabled('thermal_toggle')}
        style={{
          ...buttonStyle(thermalEnabled ? 'amber' : undefined),
          width: 62,
        }}
        title={thermalLabel}
      >
        <Icon name="thermometer" size={14} />
        <span>
          {busyCommand === 'thermal_toggle' ? sendingLabel : thermalLabel}
        </span>
      </button>
      <button
        onClick={onToggleMore}
        disabled={busyCommand !== null}
        style={buttonStyle()}
        title={t.moreControls}
      >
        <Icon name="chevronRight" size={14} />
        <span>{t.more}</span>
      </button>
      {moreOpen && (
        <GlassPanel
          style={{
            position: 'absolute',
            right: 0,
            bottom: 46,
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 48px)',
            gap: 5,
            padding: 6,
            zIndex: 10,
          }}
        >
          {moreToolControls.map(renderControl)}
        </GlassPanel>
      )}
      <div
        style={{
          width: '100%',
          marginTop: 6,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, minmax(42px, 1fr))',
          gap: 4,
        }}
      >
        {weatherControls.map((item) => (
          <button
            key={item.preset}
            onClick={() => onWeatherPreset(item.preset)}
            disabled={!canFly || busyCommand !== null}
            style={{
              ...buttonStyle(item.tone),
              width: 'auto',
              height: 28,
              minWidth: 0,
              fontSize: 7,
            }}
            title={t.weatherTitle(t.weather[item.labelKey])}
          >
            <Icon name="thermometer" size={11} />
            <span>{t.weather[item.labelKey]}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
