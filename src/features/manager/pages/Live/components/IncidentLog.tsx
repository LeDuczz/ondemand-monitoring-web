import { Card } from '../../../../../shared/components/ui'
import type { LiveTelemetry } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { incidentLogMessages } from './IncidentLog.messages'

export function IncidentLog({
  telemetry,
}: {
  telemetry: LiveTelemetry | null
}) {
  const { t, locale } = useI18n(incidentLogMessages)
  if (!telemetry || telemetry.activeIncidents.length === 0) return null
  return (
    <Card title={t.incidentLog(telemetry.activeIncidents.length)}>
      <ul className="odm-live-incidents">
        {telemetry.activeIncidents.map((inc) => (
          <li key={inc.id}>
            <div className="odm-live-incident-head">
              <span className="odm-live-incident-type">{inc.type}</span>
              <span className="odm-live-incident-time">
                {new Date(inc.reportedAt).toLocaleTimeString(locale, {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <p>{inc.description}</p>
          </li>
        ))}
      </ul>
    </Card>
  )
}
