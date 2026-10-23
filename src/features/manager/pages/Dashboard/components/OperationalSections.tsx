import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type { ManagerDashboardData } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { formatDashboardDate, statusLabel } from '../dashboardHelpers'
import { Button } from '../../../../../shared/components/ui'

export function OperationalSections({ data }: { data: ManagerDashboardData }) {
  const { t } = useI18n(dashboardPageMessages)
  const o = t.ops
  const pipeline = data.pricingPipeline
  const overview = data.missionOverview
  return (
    <>
      <section className="odm-card odm-mgr-section">
        <div className="odm-card-header">{o.recentOrders}</div>
        {data.recentOrders.length === 0 ? <DashboardEmpty text={o.noRecentOrders} /> : (
          <div className="odm-mgr-table-wrap"><table className="odm-mgr-dashboard-table"><thead><tr><th>{o.orderCode}</th><th>{o.customer}</th><th>{o.service}</th><th>{o.createdAt}</th><th>{o.status}</th><th>{o.additionalService}</th><th>{o.priceQuote}</th><th /></tr></thead><tbody>
            {data.recentOrders.map((order) => <tr key={order.orderId}>
              <td className="odm-tn">{order.orderCode}</td><td>{order.customerName}</td><td>{order.serviceName}</td><td>{formatDashboardDate(order.createdAt)}</td><td><Status value={order.status} /></td>
              <td>{order.additionalChecklistCount === 0 ? o.none : <span className={order.pendingAdditionalChecklistCount ? 'odm-mgr-inline-warning' : ''}>{order.additionalChecklistCount} {o.additional}{order.pendingAdditionalChecklistCount ? ` · ${order.pendingAdditionalChecklistCount} ${o.pendingReview}` : ''}</span>}</td>
              <td>{order.pricingState === 'NEEDS_MANAGER_REVIEW' ? o.incomplete : o.processed}</td><td><Button size="sm" href={managerHref({ screen: 'orderReview', orderId: order.orderId })}>{o.view}</Button></td>
            </tr>)}</tbody></table></div>
        )}
      </section>

      <div className="odm-mgr-overview-grid">
        <section className="odm-card odm-mgr-section">
          <div className="odm-card-header">{o.quotesPayments}</div>
          <PipelineRow label={o.pricingReview} value={pipeline.pricingReviewCount} />
          <PipelineRow label={o.quoteReady} value={pipeline.quoteReadyCount} />
          <PipelineRow label={o.waitingCustomer} value={pipeline.waitingCustomerCount} />
          <PipelineRow label={o.waitingDeposit} value={pipeline.waitingDepositCount} />
          <PipelineRow label={o.depositPaid} value={pipeline.depositPaidCount} success />
          <div className="odm-mgr-section-action"><Button href={managerHref({ screen: 'orderQueue' })}>{o.viewAllQuotes}</Button></div>
        </section>
        <section className="odm-card odm-mgr-section">
          <div className="odm-card-header">Mission overview</div>
          <div className="odm-mgr-mission-stats">
            <PipelineRow label="Scheduled" value={overview.scheduledCount} /><PipelineRow label="Ready" value={overview.readyCount} /><PipelineRow label="In Flight" value={overview.inFlightCount} /><PipelineRow label="Returning" value={overview.returningCount} /><PipelineRow label="Completed Today" value={overview.completedTodayCount} success /><PipelineRow label="Issues" value={overview.issueCount} danger />
          </div>
          <div className="odm-mgr-section-action"><Button href={managerHref({ screen: 'missions' })}>{o.viewAllMissions}</Button></div>
        </section>
      </div>

      <section className="odm-card odm-mgr-section">
        <div className="odm-card-header">{o.activeMissions}</div>
        {data.activeMissions.length === 0 ? <DashboardEmpty text={o.noActiveMissions} /> : (
          <div className="odm-mgr-table-wrap"><table className="odm-mgr-dashboard-table"><thead><tr><th>Mission</th><th>Order</th><th>Operator</th><th>Drone</th><th>{o.status}</th><th>{o.schedule}</th><th /></tr></thead><tbody>
            {data.activeMissions.map((mission) => <tr key={mission.missionId} className={mission.attentionRequired ? 'is-attention' : ''}><td className="odm-tn">{mission.missionCode}</td><td className="odm-tn">{mission.orderCode}</td><td>{mission.operatorName ?? o.unassigned}</td><td>{mission.droneName ?? o.unassigned}</td><td><Status value={mission.status} warning={mission.attentionRequired} /></td><td>{formatDashboardDate(mission.scheduledStartAt)}</td><td><Button size="sm" href={managerHref({ screen: 'missionDetail', missionId: mission.missionId })}>{o.view}</Button></td></tr>)}
          </tbody></table></div>
        )}
      </section>

      <section className="odm-card odm-mgr-section">
        <div className="odm-card-header">{o.recentActivity}</div>
        {data.recentActivities.length === 0 ? <DashboardEmpty text={o.noRecentActivity} /> : <ol className="odm-mgr-activity-list">{data.recentActivities.map((activity) => <li key={activity.id}><time dateTime={activity.occurredAt}>{formatDashboardDate(activity.occurredAt)}</time><span>{activity.description}</span></li>)}</ol>}
      </section>
    </>
  )
}

function PipelineRow({ label, value, success, danger }: { label: string; value: number; success?: boolean; danger?: boolean }) {
  return <div className={`odm-mgr-pipeline-row ${success ? 'is-success' : ''} ${danger ? 'is-danger' : ''}`}><span>{label}</span><strong className="odm-tn">{value}</strong></div>
}

function Status({ value, warning }: { value: string; warning?: boolean }) {
  return <span className={`odm-mgr-status ${warning ? 'is-warning' : ''}`}>{statusLabel(value)}</span>
}

function DashboardEmpty({ text }: { text: string }) {
  return <div className="odm-mgr-dashboard-empty">{text}</div>
}
