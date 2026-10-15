import type { FlightControlStatus } from '../../../api/flightControlApi'
import { useI18n } from '../../../../../shared/i18n'
import { formatMetric } from '../postflightHelpers'
import { telemetrySummaryMessages } from './TelemetrySummary.messages'

function TelemetryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ minWidth: 0 }}>
      <div
        style={{ fontSize: 11, color: 'var(--tx3, #64748b)', fontWeight: 800 }}
      >
        {label}
      </div>
      <div
        style={{
          marginTop: 3,
          fontSize: 17,
          color: 'var(--tx, #0f172a)',
          fontWeight: 900,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        title={value}
      >
        {value}
      </div>
    </div>
  )
}

export function TelemetrySummary({
  telemetrySnapshot,
}: {
  telemetrySnapshot: FlightControlStatus
}) {
  const { t } = useI18n(telemetrySummaryMessages)
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 10,
        padding: '12px 14px',
        borderRadius: 12,
        background: 'rgba(37, 99, 235, 0.06)',
        border: '1px solid rgba(37, 99, 235, 0.18)',
      }}
    >
      <TelemetryMetric
        label={t.landingBattery}
        value={formatMetric(telemetrySnapshot.batteryPercent, '%', 1)}
      />
      <TelemetryMetric
        label={t.altitude}
        value={formatMetric(telemetrySnapshot.altitudeM, ' m', 1)}
      />
      <TelemetryMetric
        label={t.speed}
        value={formatMetric(telemetrySnapshot.speedMps, ' m/s', 1)}
      />
      <TelemetryMetric
        label={t.heading}
        value={formatMetric(telemetrySnapshot.headingDeg, '°', 0)}
      />
    </div>
  )
}
