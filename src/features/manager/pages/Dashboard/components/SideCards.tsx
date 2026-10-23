import { Card, EmptyState } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type { ActiveMission, DashboardActivity, PricingPipeline } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { formatDashboardDate, statusLabel } from '../dashboardHelpers'

const MAX_MISSIONS = 6
const MAX_ACTIVITIES = 8

export function ActiveMissionsCard({ missions }: { missions: ActiveMission[] }) {
  const { t } = useI18n(dashboardPageMessages)
  const m = t.missions
  return (
    <Card title={m.title} actions={<a href={managerHref({ screen: 'missions' })}>{m.viewAll}</a>}>
      {missions.length === 0 ? (
        <EmptyState title={m.empty} />
      ) : (
        <ul className="odm-dash-list">
          {missions.slice(0, MAX_MISSIONS).map((mission) => (
            <li key={mission.missionId}>
              <a className="odm-dash-row is-link" href={managerHref({ screen: 'missionDetail', missionId: mission.missionId })}>
                <span className={`odm-dash-dot is-${mission.attentionRequired ? 'danger' : 'success'}`}
                  role="img" aria-label={mission.attentionRequired ? m.attention : statusLabel(mission.status)} />
                <div className="odm-dash-row-main">
                  <div className="odm-dash-row-title odm-tn">{mission.missionCode}</div>
                  <div className="odm-dash-row-meta">
                    {formatDashboardDate(mission.scheduledStartAt)} · {mission.droneName ?? m.unassigned}
                  </div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}

export function PipelineCard({ pipeline }: { pipeline: PricingPipeline }) {
  const { t } = useI18n(dashboardPageMessages)
  const p = t.pipeline
  const stages = [
    { label: p.review, value: pipeline.pricingReviewCount },
    { label: p.quoteReady, value: pipeline.quoteReadyCount },
    { label: p.waitingCustomer, value: pipeline.waitingCustomerCount },
    { label: p.waitingDeposit, value: pipeline.waitingDepositCount },
    { label: p.depositPaid, value: pipeline.depositPaidCount },
  ]
  const max = Math.max(...stages.map((s) => s.value))
  return (
    <Card title={p.title}>
      {max === 0 ? (
        <EmptyState title={p.empty} />
      ) : (
        <div className="odm-dash-funnel" role="img" aria-label={p.title}>
          {stages.map((s) => (
            <div key={s.label} className="odm-dash-funnel-row">
              <span>{s.label}</span>
              <strong className="odm-tn">{s.value}</strong>
              <div className="odm-dash-track"><span style={{ width: `${(s.value / max) * 100}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export function RecentActivityCard({ activities }: { activities: DashboardActivity[] }) {
  const { t } = useI18n(dashboardPageMessages)
  return (
    <Card title={t.activity.title}>
      {activities.length === 0 ? (
        <EmptyState title={t.activity.empty} />
      ) : (
        <ol className="odm-dash-timeline">
          {activities.slice(0, MAX_ACTIVITIES).map((activity) => (
            <li key={activity.id}>
              <time dateTime={activity.occurredAt}>{formatDashboardDate(activity.occurredAt)}</time>
              <span>{activity.description}</span>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
