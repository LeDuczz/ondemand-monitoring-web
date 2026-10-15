import { StatCard, StatusBadge } from '../../../../../shared/components/ui'
import { formatFlightTime } from '../liveHelpers'
import type { LiveTelemetry } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { telemetryPanelMessages } from './TelemetryPanel.messages'

/** KPI row. Renders placeholders while telemetry is unavailable. */
export function TelemetryPanel({
  telemetry,
}: {
  telemetry: LiveTelemetry | null
}) {
  const { t } = useI18n(telemetryPanelMessages)
  const dash = '—'
  return (
    <>
      <div className="odm-live-kpis">
        <StatCard
          label={t.telemetry.battery}
          value={
            telemetry?.batteryPct != null ? `${telemetry.batteryPct}%` : dash
          }
          hint={telemetry ? t.telemetry.batteryLossHint : undefined}
        />
        <StatCard
          label={t.telemetry.flightTime}
          value={
            telemetry?.flightTimeSec != null
              ? formatFlightTime(telemetry.flightTimeSec)
              : dash
          }
        />
        <StatCard
          label={t.telemetry.altitude}
          value={
            telemetry?.altitudeM != null ? `${telemetry.altitudeM} m` : dash
          }
        />
        <StatCard
          label={t.telemetry.speed}
          value={telemetry?.speedMs != null ? `${telemetry.speedMs} m/s` : dash}
        />
        <StatCard
          label={t.telemetry.signal}
          value={
            telemetry?.signalDbm != null ? `${telemetry.signalDbm} dBm` : dash
          }
          hint={
            telemetry?.satelliteCount != null
              ? `${t.telemetry.satellites}: ${telemetry.satelliteCount} ${t.telemetry.gps}`
              : undefined
          }
        />
      </div>

      {telemetry && (
        <p className="odm-live-conn">
          <span>
            {t.connectionStatus}{' '}
            <strong>{telemetry.connectionStatus ?? dash}</strong>
          </span>
          <span>
            {t.telemetryActive}{' '}
            <StatusBadge
              tone={telemetry.telemetryActive ? 'success' : 'danger'}
            >
              {telemetry.telemetryActive ? t.yes : t.no}
            </StatusBadge>
          </span>
        </p>
      )}
    </>
  )
}
