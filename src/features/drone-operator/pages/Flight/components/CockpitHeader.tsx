import { useI18n } from '../../../../../shared/i18n'
import type { BatteryTone, CockpitLayout } from './cockpitTypes'
import { Ico } from './CockpitIcon'
import { cockpitHeaderMessages } from './CockpitHeader.messages'

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen?.()
  else void document.documentElement.requestFullscreen?.()
}

export function CockpitHeader({
  missionLabel,
  roleLabel,
  liveLabel,
  online,
  clock,
  battery,
  batteryTone,
  gpsText,
  layout,
  onLayoutChange,
  busy,
  onReview,
  onStartFlight,
  canStartFlight,
  startingFlight,
}: {
  missionLabel: string
  roleLabel: string
  liveLabel: string
  online: boolean
  clock: string
  battery: number | null
  batteryTone: BatteryTone
  gpsText: string
  layout: CockpitLayout
  onLayoutChange: (layout: CockpitLayout) => void
  busy: boolean
  onReview: () => void
  onStartFlight?: () => void
  canStartFlight: boolean
  startingFlight: boolean
}) {
  const { t } = useI18n(cockpitHeaderMessages)

  return (
    <header className="fc-header">
      <div className="fc-brand">
        <span className="fc-brand__logo">
          <Ico name="drone" size={26} />
        </span>
        <div>
          <strong>{t.brand}</strong>
          <small>{t.brandSub}</small>
        </div>
      </div>

      <div className="fc-header__group">
        <div className="fc-mission">
          <strong>{missionLabel}</strong>
          <small>{roleLabel}</small>
        </div>
        <span className={`fc-live ${online ? 'is-on' : 'is-off'}`}>
          {liveLabel}
        </span>
        <div className="fc-clock">
          <strong>{clock}</strong>
          <small>{t.flightTime}</small>
        </div>
      </div>

      <div className="fc-header__group">
        <div className={`fc-chip ${online ? 'is-ok' : 'is-bad'}`}>
          <Ico name="link" size={20} />
          <div>
            <strong>{t.link}</strong>
            <small>{online ? t.linkOk : t.linkOff}</small>
          </div>
        </div>
        <div
          className={`fc-chip is-${batteryTone === 'ok' ? 'ok' : batteryTone === 'mid' ? 'warn' : 'bad'}`}
        >
          <Ico name="battery" size={20} />
          <div>
            <strong>
              {battery === null ? '--' : `${Math.round(battery)}%`}
            </strong>
            <small>{t.battery}</small>
          </div>
        </div>
        <div className="fc-chip is-info fc-chip--gps">
          <Ico name="pin" size={20} />
          <div>
            <strong className="fc-mono">{gpsText}</strong>
            <small>GPS</small>
          </div>
        </div>
      </div>

      <div className="fc-header__actions">
        {onStartFlight && canStartFlight ? (
          <button
            type="button"
            className="fc-start-flight fc-start-flight--header"
            aria-label={t.startFlight}
            disabled={busy || startingFlight}
            onClick={onStartFlight}
          >
            <Ico name="takeoff" size={19} />
            <span>
              <strong>{startingFlight ? t.startingFlight : t.startFlight}</strong>
              <small>{t.setInFlight}</small>
            </span>
          </button>
        ) : null}
        <div className="fc-seg" role="group" aria-label={t.layout}>
          {(
            [
              ['split', t.layoutSplit],
              ['camera', t.layoutCamera],
              ['map', t.layoutMap],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className={layout === key ? 'is-active' : ''}
              aria-pressed={layout === key}
              onClick={() => onLayoutChange(key)}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="fc-ghost"
          onClick={onReview}
          disabled={busy}
        >
          <Ico name="review" /> {t.review}
        </button>
        <button
          type="button"
          className="fc-icon-btn"
          onClick={toggleFullscreen}
          aria-label={t.fullscreen}
          title={t.fullscreen}
        >
          <Ico name="expand" />
        </button>
      </div>
    </header>
  )
}
