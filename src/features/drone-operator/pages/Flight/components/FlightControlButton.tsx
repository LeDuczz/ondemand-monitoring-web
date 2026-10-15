import type { IconName } from '../inFlightTypes'
import { buttonStyle } from './flightControlStyles'
import { Icon } from './Icon'

export function FlightControlButton({
  icon,
  label,
  tone,
  busy,
  sendingLabel,
  disabled,
  onClick,
}: {
  icon: IconName
  label: string
  tone?: 'danger' | 'amber'
  busy: boolean
  sendingLabel: string
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...buttonStyle(tone),
      }}
      title={label}
    >
      <Icon name={icon} size={14} />
      <span>{busy ? sendingLabel : label}</span>
    </button>
  )
}
