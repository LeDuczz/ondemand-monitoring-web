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

  return (
    <section className="fc-panel">
      <header className="fc-panel__head">
        <span className="fc-panel__title is-bar">{t.params}</span>
        <span className={`fc-badge ${tm.inAir ? 'is-ok' : 'is-mid'}`}>
          <i className="fc-dot" />
          {tm.inAir ? t.flying : t.ground}
        </span>
      </header>
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
        <Stat
          icon="home"
          label={t.toBase}
          value={fmt(tm.baseDistanceKm, 2)}
          unit="km"
        />
        <Stat
          icon="pin"
          label={t.toTarget}
          value={fmt(tm.targetDistanceKm, 2)}
          unit="km"
        />
        <div className={`fc-stat fc-stat--battery is-${batteryTone}`}>
          <span className="fc-stat__icon">
            <Ico name="battery" size={22} />
          </span>
          <div>
            <span className="fc-stat__label">{t.battery}</span>
            <strong>
              {battery === null ? '--' : `${battery.toFixed(1)}%`}
            </strong>
            <span className="fc-battery">
              <i style={{ width: `${battery ?? 0}%` }} />
            </span>
          </div>
        </div>
        <Stat icon="mode" label={t.mode} value={tm.flightMode ?? '--'} />
      </div>
    </section>
  )
}
