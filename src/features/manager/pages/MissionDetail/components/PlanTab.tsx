import { Card, StatusBadge } from '../../../../../shared/components/ui'
import { PlanDetail } from './PlanDetail'
import { formatNumber } from '../../../components/common/missionDetailHelpers'
import { waypointReasonLabel } from './waypointReason'
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
  const { t, lang } = useI18n(planTabMessages)
  return (
    <>
      <Card
        title={t.planCard}
        actions={
          plan?.feasibilityStatus ? (
            <StatusBadge tone="info">{plan.feasibilityStatus}</StatusBadge>
          ) : undefined
        }
      >
        <PlanDetail
          plan={plan}
          postcheck={postcheck}
          precheckItems={preflight?.items}
        />
      </Card>
      <Card
        title={t.waypoints.title}
        actions={<StatusBadge tone="neutral">{waypoints.length}</StatusBadge>}
        flush={waypoints.length > 0}
      >
        {waypoints.length === 0 ? (
          <p className="odm-or-empty">{t.waypoints.empty}</p>
        ) : (
          <div className="ui-table-scroll">
            <table className="odm-md-table">
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
                    <td>{formatNumber(point.altitudeM, ' m', lang)}</td>
                    <td>{formatNumber(point.plannedSpeedMps, ' m/s', lang)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}
