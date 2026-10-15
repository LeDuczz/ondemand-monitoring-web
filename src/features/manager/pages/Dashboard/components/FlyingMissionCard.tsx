import { Card } from '../../../../../shared/components/ui'
import type { ManagerDashboardResponse } from '../../../types/dashboard'
import { formatFlightProgress } from '../../../lib/actionItemAge'
import { managerHref } from '../../../routes'
import { useI18n } from '../../../../../shared/i18n'
import { flyingMissionCardMessages } from './FlyingMissionCard.messages'

export function FlyingMissionCard({
  data,
  now,
}: {
  data: ManagerDashboardResponse
  now: Date
}) {
  const { t } = useI18n(flyingMissionCardMessages)
  const mission = data.flyingMission
  if (!mission) return null
  return (
    <Card title={t.flying.title}>
      <div className="mng-cell-main odm-mono">{mission.code}</div>
      <div className="mng-cell-sub" style={{ marginBottom: 12 }}>
        {mission.title}
      </div>
      <div className="mng-kv">
        <span className="mng-kv-label">{t.flying.droneOperator}</span>
        <span className="mng-kv-value">
          {mission.droneCode} · {mission.operatorName}
        </span>
      </div>
      <div className="mng-kv">
        <span className="mng-kv-label">{t.flying.battery}</span>
        <span className="mng-battery">
          <span className="mng-battery-track">
            <span
              className="mng-battery-fill"
              style={{ width: `${mission.batteryPercent}%` }}
            />
          </span>
          <span className="odm-tn">{mission.batteryPercent}%</span>
        </span>
      </div>
      <div className="mng-kv">
        <span className="mng-kv-label">{t.flying.flightTime}</span>
        <span className="mng-kv-value odm-tn">
          {formatFlightProgress(
            now,
            mission.startedAtIso,
            mission.plannedDurationMin,
          )}
        </span>
      </div>
      <div className="mng-flying-cta">
        <a
          className="odm-btn odm-btn-p"
          href={managerHref({ screen: 'live', missionId: mission.missionId })}
        >
          {t.flying.monitor}
        </a>
      </div>
    </Card>
  )
}
