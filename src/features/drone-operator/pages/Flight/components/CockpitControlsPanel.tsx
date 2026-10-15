import { useEffect, useState } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import type { CockpitCommand } from './cockpitTypes'
import { Ico } from './CockpitIcon'
import { cockpitControlsPanelMessages } from './CockpitControlsPanel.messages'

export function CockpitControlsPanel({
  busy,
  canFly,
  canTerminate,
  canFlyToTarget,
  onCommand,
  onFinishFlight,
  finishingFlight,
}: {
  busy: boolean
  canFly: boolean
  canTerminate: boolean
  canFlyToTarget: boolean
  onCommand: (command: CockpitCommand) => void
  onFinishFlight?: () => void
  finishingFlight?: boolean
}) {
  const { t } = useI18n(cockpitControlsPanelMessages)
  const [confirmStop, setConfirmStop] = useState(false)
  useEffect(() => {
    if (!confirmStop) return
    const timer = window.setTimeout(() => setConfirmStop(false), 3000)
    return () => window.clearTimeout(timer)
  }, [confirmStop])

  const controls: Array<{
    cmd: CockpitCommand
    icon: string
    label: string
    sub: string
    tone?: string
    enabled: boolean
  }> = [
    {
      cmd: 'takeoff',
      icon: 'takeoff',
      label: t.takeoff,
      sub: t.takeoffSub,
      enabled: canFly,
    },
    {
      cmd: 'gps_target_start',
      icon: 'fly',
      label: t.fly,
      sub: t.flySub,
      tone: 'primary',
      enabled: canFly && canFlyToTarget,
    },
    {
      cmd: 'stop',
      icon: 'pause',
      label: t.pause,
      sub: t.pauseSub,
      enabled: canFly || canTerminate,
    },
    {
      cmd: 'photo',
      icon: 'photo',
      label: t.photo,
      sub: t.photoSub,
      enabled: canFly,
    },
    {
      cmd: 'return_to_base',
      icon: 'rtl',
      label: t.rtl,
      sub: t.rtlSub,
      enabled: canFly || canTerminate,
    },
    {
      cmd: 'land',
      icon: 'land',
      label: t.land,
      sub: t.landSub,
      tone: 'success',
      enabled: canFly || canTerminate,
    },
  ]

  return (
    <section className="fc-panel">
      <header className="fc-panel__head">
        <span className="fc-panel__title is-bar">{t.control}</span>
      </header>
      <div className="fc-controls">
        {controls.map((item) => (
          <button
            key={item.cmd}
            type="button"
            className={`fc-ctl${item.tone ? ` is-${item.tone}` : ''}`}
            disabled={busy || !item.enabled}
            onClick={() => onCommand(item.cmd)}
          >
            <Ico name={item.icon} size={20} />
            <strong>{item.label}</strong>
            <small>{item.sub}</small>
          </button>
        ))}
        {onFinishFlight ? (
          <button
            type="button"
            className="fc-ctl is-success"
            disabled={busy || finishingFlight || (!canFly && !canTerminate)}
            onClick={onFinishFlight}
          >
            <Ico name="land" size={20} />
            <strong>{finishingFlight ? t.updating : t.finishFlight}</strong>
            <small>{t.finishFlightSub}</small>
          </button>
        ) : null}
      </div>
      <button
        type="button"
        className={`fc-emergency${confirmStop ? ' is-armed' : ''}`}
        disabled={busy || (!canFly && !canTerminate)}
        onClick={() => {
          if (!confirmStop) {
            setConfirmStop(true)
            return
          }
          setConfirmStop(false)
          onCommand('emergency_stop')
        }}
      >
        <Ico name="stop" size={30} />
        <span>
          <strong>{t.emergency}</strong>
          <small>{confirmStop ? t.emergencyConfirm : t.emergencySub}</small>
        </span>
      </button>
    </section>
  )
}
