import type { ReactNode } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import type { FlightCommand } from '../inFlightTypes'
import { flightControls, type FlightControlItem } from './flightControlItems'
import { buttonStyle, toolbarGroupStyle } from './flightControlStyles'
import { Icon } from './Icon'
import { quickActionsGroupMessages } from './QuickActionsGroup.messages'

export function QuickActionsGroup({
  renderControl,
  commandDisabled,
  onCommand,
}: {
  renderControl: (item: FlightControlItem) => ReactNode
  commandDisabled: (command: FlightCommand) => boolean
  onCommand: (command: FlightCommand) => void
}) {
  const { t } = useI18n(quickActionsGroupMessages)
  return (
    <div style={{ ...toolbarGroupStyle, alignContent: 'center' }}>
      <div
        style={{
          width: '100%',
          color: '#94a3b8',
          fontSize: 10,
          fontWeight: 850,
          marginBottom: 2,
        }}
      >
        {t.quickActions}
      </div>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: 4,
        }}
      >
        {flightControls.map(renderControl)}
        <button
          onClick={() => onCommand('stop')}
          disabled={commandDisabled('stop')}
          style={{
            ...buttonStyle(),
            background: 'rgba(20,83,45,.82)',
            color: '#86efac',
          }}
          title={t.hover}
        >
          <Icon name="joystick" size={14} />
          <span>{t.hover}</span>
        </button>
      </div>
    </div>
  )
}
