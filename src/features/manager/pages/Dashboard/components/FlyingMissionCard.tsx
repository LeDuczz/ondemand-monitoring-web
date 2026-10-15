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
  return data.flyingMission ? (
    <div className="odm-card odm-mgr-flying-card">
      <div className="odm-card-header">{t.flying.title}</div>
      <div className="odm-card-body odm-mgr-flying-body">
        <div>
          <div className="odm-mgr-flying-code odm-mono">
            {data.flyingMission.code}
          </div>
          <div className="odm-mgr-flying-title">{data.flyingMission.title}</div>
        </div>
        <div className="odm-mgr-flying-field">
          <div className="odm-mgr-flying-label">{t.flying.droneOperator}</div>
          <div>
            {data.flyingMission.droneCode} · {data.flyingMission.operatorName}
          </div>
        </div>
        <div className="odm-mgr-flying-field">
          <div className="odm-mgr-flying-label">{t.flying.battery}</div>
          <div className="odm-mgr-battery">
            <span className="odm-mgr-battery-track">
              <span
                className="odm-mgr-battery-fill"
                style={{ width: `${data.flyingMission.batteryPercent}%` }}
              />
            </span>
            <span className="odm-tn">{data.flyingMission.batteryPercent}%</span>
          </div>
        </div>
        <div className="odm-mgr-flying-field">
          <div className="odm-mgr-flying-label">{t.flying.flightTime}</div>
          <div className="odm-tn">
            {formatFlightProgress(
              now,
              data.flyingMission.startedAtIso,
              data.flyingMission.plannedDurationMin,
            )}
          </div>
        </div>
        <a
          className="odm-btn odm-btn-p"
          href={managerHref({
            screen: 'live',
            missionId: data.flyingMission.missionId,
          })}
        >
          {t.flying.monitor}
        </a>
      </div>
    </div>
  ) : null
}
