import { DetailSection } from './DetailSection'
import { PlanDetail } from './PlanDetail'
import { formatNumber } from '../../../components/common/missionDetailHelpers'
import { waypointReasonLabel } from './MissionRouteMap'
import type { MissionPlanResponse } from '../../../types/missions'
import type { PersistedPostDeviceCheckResponse } from '../../../types/missions'
import type { PersistedPreflightCheckResponse } from '../../../types/missions'
import type { PlanWaypointResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { planTabMessages } from './PlanTab.messages'

export function PlanTab({
  plan,
  postcheck,
  preflight,
  waypoints,
}: {
  plan: MissionPlanResponse | null
  postcheck: PersistedPostDeviceCheckResponse | null
  preflight: PersistedPreflightCheckResponse | null
  waypoints: PlanWaypointResponse[]
}) {
  const { t } = useI18n(planTabMessages)
  return (
    <>
      <section className="odm-or-card">
        <div className="odm-or-card-body">
          <DetailSection title={t.planCard} badge={plan?.feasibilityStatus}>
            <PlanDetail
              plan={plan}
              postcheck={postcheck}
              precheckItems={preflight?.items}
            />
          </DetailSection>
        </div>
      </section>
      <section className="odm-or-card">
        <div className="odm-or-card-body">
          <DetailSection
            title={t.waypoints.title}
            badge={String(waypoints.length)}
          >
            {waypoints.length === 0 ? (
              <div className="odm-or-empty">{t.waypoints.empty}</div>
            ) : (
              <div className="odm-or-table-scroll">
                <table className="odm-or-table">
                  <thead>
                    <tr>
                      <th>{t.waypoints.columns.seq}</th>
                      <th>{t.waypoints.columns.type}</th>
                      <th>{t.waypoints.columns.x}</th>
                      <th>{t.waypoints.columns.y}</th>
                      <th>{t.waypoints.columns.altitude}</th>
                      <th>{t.waypoints.columns.speed}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {waypoints.map((point) => (
                      <tr key={point.id}>
                        <td className="odm-mono">{point.sequence}</td>
                        <td>{waypointReasonLabel(point.reason)}</td>
                        <td className="odm-mono">{point.simX.toFixed(2)}</td>
                        <td className="odm-mono">{point.simY.toFixed(2)}</td>
                        <td>{formatNumber(point.altitudeM, ' m')}</td>
                        <td>{formatNumber(point.plannedSpeedMps, ' m/s')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </DetailSection>
        </div>
      </section>
    </>
  )
}
