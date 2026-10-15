import { useI18n } from '../../../../../shared/i18n'
import type { FlightCommand } from '../inFlightTypes'
import {
  movementControls,
  rotationControls,
  type ControlsText,
} from './flightControlItems'
import { buttonStyle, toolbarGroupStyle } from './flightControlStyles'
import { Icon } from './Icon'
import { manualControlGroupMessages } from './ManualControlGroup.messages'

export function ManualControlGroup({
  labels,
  sendingLabel,
  busyCommand,
  commandDisabled,
  onCommand,
}: {
  labels: ControlsText
  sendingLabel: string
  busyCommand: FlightCommand | null
  commandDisabled: (command: FlightCommand) => boolean
  onCommand: (command: FlightCommand) => void
}) {
  const { t } = useI18n(manualControlGroupMessages)
  return (
    <div
      style={{
        ...toolbarGroupStyle,
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 46px)',
        alignContent: 'center',
        gap: 4,
      }}
    >
      <div
        style={{
          gridColumn: '1 / -1',
          color: '#94a3b8',
          fontSize: 10,
          fontWeight: 850,
          marginBottom: 1,
        }}
      >
        {t.title}
      </div>
      {movementControls.map((item) => (
        <button
          key={item.labelKey}
          onClick={() => onCommand(item.command)}
          disabled={commandDisabled(item.command)}
          style={{
            width: 46,
            height: 29,
            borderRadius: 8,
            border: '1px solid rgba(148,163,184,.18)',
            background: 'rgba(15,23,42,.78)',
            color: '#e5edf8',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
            cursor: 'pointer',
            fontSize: 7,
            fontWeight: 850,
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)',
          }}
          title={labels[item.labelKey]}
        >
          <Icon name={item.icon} size={12} />
          <span>{labels[item.labelKey]}</span>
        </button>
      ))}
      {rotationControls.map((item) => (
        <button
          key={item.labelKey}
          onClick={() => onCommand(item.command)}
          disabled={commandDisabled(item.command)}
          style={{
            ...buttonStyle(),
            width: 46,
            height: 29,
            fontSize: 7,
          }}
          title={labels[item.labelKey]}
        >
          <Icon name={item.icon} size={12} />
          <span>
            {busyCommand === item.command
              ? sendingLabel
              : labels[item.labelKey]}
          </span>
        </button>
      ))}
    </div>
  )
}
