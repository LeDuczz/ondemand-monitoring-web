import { formatFlightProgress } from '../../../lib/actionItemAge'
import { managerHref } from '../../../routes'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { useI18n } from '../../../../../shared/i18n'
import type { ManagerDashboardResponse } from '../../../types/dashboard'

export function FlyingMissionCard({
  flyingMission,
  now,
}: {
  flyingMission: NonNullable<ManagerDashboardResponse['flyingMission']>
  now: Date
}) {
  const { t } = useI18n(dashboardPageMessages)
  return (
    <div className="odm-card odm-mgr-flying-card">
      <div className="odm-card-header">{t.flying.title}</div>
      <div className="odm-card-body odm-mgr-flying-body">
        <div>
          <div className="odm-mgr-flying-code odm-mono">
            {flyingMission.code}
          </div>
          <div className="odm-mgr-flying-title">{flyingMission.title}</div>
        </div>
        <div className="odm-mgr-flying-field">
          <div className="odm-mgr-flying-label">{t.flying.droneOperator}</div>
          <div>
            {flyingMission.droneCode} · {flyingMission.operatorName}
          </div>
        </div>
        <div className="odm-mgr-flying-field">
          <div className="odm-mgr-flying-label">{t.flying.battery}</div>
          <div className="odm-mgr-battery">
            <span className="odm-mgr-battery-track">
              <span
                className="odm-mgr-battery-fill"
                style={{ width: `${flyingMission.batteryPercent}%` }}
              />
            </span>
            <span className="odm-tn">{flyingMission.batteryPercent}%</span>
          </div>
        </div>
        <div className="odm-mgr-flying-field">
          <div className="odm-mgr-flying-label">{t.flying.flightTime}</div>
          <div className="odm-tn">
            {formatFlightProgress(
              now,
              flyingMission.startedAtIso,
              flyingMission.plannedDurationMin,
            )}
          </div>
        </div>
        <a
          className="odm-btn odm-btn-p"
          href={managerHref({
            screen: 'live',
            missionId: flyingMission.missionId,
          })}
        >
          {t.flying.monitor}
        </a>
      </div>
    </div>
  )
}
