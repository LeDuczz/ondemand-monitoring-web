import { useState } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { fmt } from './cockpitHelpers'
import type { BatteryTone, CockpitTelemetry } from './cockpitTypes'
import { AttitudeIndicator } from './AttitudeIndicator'
import { CompassRose } from './CompassRose'
import { Ico } from './CockpitIcon'
import { Stat } from './CockpitStat'
import { cockpitTelemetryPanelMessages } from './CockpitTelemetryPanel.messages'

export function CockpitTelemetryPanel({
  tm,
  battery,
  batteryTone,
}: {
  tm: CockpitTelemetry
  battery: number | null
  batteryTone: BatteryTone
}) {
  const { t } = useI18n(cockpitTelemetryPanelMessages)
  const [open, setOpen] = useState(true)
  const hasGps = tm.latitude !== null && tm.longitude !== null

  return (
    <section className="fc-panel">
      <header className="fc-panel__head">
        <span className="fc-panel__title is-bar">{t.params}</span>
        <span className="fc-panel__tools">
          <span className={`fc-badge ${tm.inAir ? 'is-ok' : 'is-mid'}`}>
            <i className="fc-dot" />
            {tm.inAir ? t.flying : t.ground}
          </span>
          <button
            type="button"
            className={`fc-collapse${open ? '' : ' is-closed'}`}
            aria-expanded={open}
            aria-label={open ? t.collapse : t.expandPanel}
            title={open ? t.collapse : t.expandPanel}
            onClick={() => setOpen((value) => !value)}
          >
            <Ico name="chevron" size={18} />
          </button>
        </span>
      </header>
      {open ? (
        <>
          <div className="fc-instruments">
            <AttitudeIndicator
              roll={tm.rollDeg ?? null}
              pitch={tm.pitchDeg ?? null}
              label={`${t.roll} ${fmt(tm.rollDeg, 0)}° · ${t.pitch} ${fmt(tm.pitchDeg, 0)}°`}
            />
            <CompassRose heading={tm.headingDeg} label={t.heading} />
          </div>
          <div className="fc-stats">
            <Stat
              icon="altitude"
              label={t.altitude}
              value={fmt(tm.altitudeM)}
              unit="m"
              tone="accent"
            />
            <Stat
              icon="speed"
              label={t.speed}
              value={fmt(tm.speedMps)}
              unit="m/s"
              tone="accent"
            />
            <Stat
              icon="vertical"
              label={t.vertical}
              value={fmt(tm.verticalMps)}
              unit="m/s"
            />
            <Stat
              icon="compass"
              label={t.heading}
              value={
                tm.headingDeg === null ? '--' : `${Math.round(tm.headingDeg)}°`
              }
            />
            <div className={`fc-stat fc-stat--battery is-${batteryTone}`}>
              <span className="fc-stat__icon">
                <Ico name="battery" size={22} />
              </span>
              <div>
                <span className="fc-stat__label">{t.battery}</span>
                <strong>
                  {battery === null ? '--' : `${battery.toFixed(0)}%`}
                </strong>
              </div>
            </div>
            <div className="fc-stat fc-stat--gps">
              <span className="fc-stat__icon">
                <Ico name="pin" size={22} />
              </span>
              <div>
                <span className="fc-stat__label">{t.gps}</span>
                <strong className="fc-mono">
                  {hasGps ? (
                    <>
                      <span>{tm.latitude!.toFixed(6)} N</span>
                      <span>{tm.longitude!.toFixed(6)} E</span>
                    </>
                  ) : (
                    '--'
                  )}
                </strong>
              </div>
            </div>
          </div>
          <dl className="fc-secondary">
            <div>
              <dt>{t.toBase}</dt>
              <dd>{fmt(tm.baseDistanceKm, 2)} km</dd>
            </div>
            <div>
              <dt>{t.toTarget}</dt>
              <dd>{fmt(tm.targetDistanceKm, 2)} km</dd>
            </div>
            <div>
              <dt>{t.mode}</dt>
              <dd>{tm.flightMode ?? '--'}</dd>
            </div>
          </dl>
        </>
      ) : null}
    </section>
  )
}
