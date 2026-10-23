import { Card, EmptyState, StatusBadge } from '../../../../../shared/components/ui'
import { useI18n } from '../../../../../shared/i18n'
import { managerHref } from '../../../routes'
import type { RecentOrder } from '../../../types/dashboard'
import { dashboardPageMessages } from '../DashboardPage.messages'
import { formatDashboardDate, orderStatusTone, statusLabel } from '../dashboardHelpers'

const MAX_ROWS = 6

export function RecentOrdersCard({ orders }: { orders: RecentOrder[] }) {
  const { t } = useI18n(dashboardPageMessages)
  const o = t.orders
  return (
    <Card title={o.title} flush
      actions={<a href={managerHref({ screen: 'orderQueue' })}>{o.viewAll}</a>}>
      {orders.length === 0 ? (
        <EmptyState title={o.empty} />
      ) : (
        <div className="odm-dash-table-wrap">
          <table className="odm-dash-table">
            <thead>
              <tr><th>{o.code}</th><th>{o.customer}</th><th>{o.service}</th><th>{o.status}</th><th>{o.created}</th></tr>
            </thead>
            <tbody>
              {orders.slice(0, MAX_ROWS).map((order) => (
                <tr key={order.orderId}>
                  <td className="odm-tn">
                    <a href={managerHref({ screen: 'orderReview', orderId: order.orderId })}>{order.orderCode}</a>
                  </td>
                  <td>{order.customerName}</td>
                  <td>{order.serviceName}</td>
                  <td>
                    <StatusBadge tone={orderStatusTone(order.status)}>
                      {t.analytics.statusLabels[order.status] ?? statusLabel(order.status)}
                    </StatusBadge>
                  </td>
                  <td className="odm-dash-muted">{formatDashboardDate(order.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
