import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { customerApi } from '../api/customerApi'
import { fmtDate, getOrderStatusMeta } from '../lib/orderStatus'
import { customerHref } from '../routes'
import { dashboardPageMessages } from './DashboardPage.messages'

export function DashboardPage() {
  const { t, lang, locale } = useI18n(dashboardPageMessages)
  const { data, loading, error, reload } = useApiQuery(
    (signal) => customerApi.getDashboard(signal),
    [],
  )

  if (loading) return <LoadingState />

  if (error || !data) {
    return <ErrorState error={error} onRetry={reload} />
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t.title}</h1>
        <a
          className="odm-btn odm-btn-p"
          href={customerHref({ screen: 'createOrder' })}
        >
          {t.createOrder}
        </a>
      </div>

      {/* Live banner */}
      {data.activeLiveMission && (
        <a
          href={customerHref({
            screen: 'live',
            orderId: data.activeLiveMission.orderId,
          })}
          className="odm-cus-live-banner"
          style={{ textDecoration: 'none', display: 'block', marginBottom: 16 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: '#ef4444',
                color: '#fff',
                fontWeight: 700,
                fontSize: 11,
                borderRadius: 4,
                padding: '2px 8px',
                letterSpacing: '0.05em',
              }}
            >
              {t.live}
            </span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {data.activeLiveMission.orderTitle}
            </span>
            <span style={{ fontSize: 12, color: 'var(--tx3)' }}>
              {data.activeLiveMission.missionCode}
            </span>
            <span
              style={{ fontSize: 12, color: 'var(--tx3)', marginLeft: 'auto' }}
            >
              {t.viewersWatching(data.activeLiveMission.viewerCount)}
            </span>
          </div>
        </a>
      )}

      {/* KPI cards */}
      <div className="odm-cus-kpi-row">
        <div className="odm-cus-kpi-card">
          <div className="odm-cus-kpi-label">{t.kpi.pending}</div>
          <div className="odm-cus-kpi-value">{data.pendingCount}</div>
          <div className="odm-cus-kpi-sub">{t.kpiUnit}</div>
        </div>
        <div className="odm-cus-kpi-card">
          <div className="odm-cus-kpi-label">{t.kpi.inProgress}</div>
          <div className="odm-cus-kpi-value">{data.inProgressCount}</div>
          <div className="odm-cus-kpi-sub">{t.kpiUnit}</div>
        </div>
        <div className="odm-cus-kpi-card">
          <div className="odm-cus-kpi-label">{t.kpi.completed}</div>
          <div className="odm-cus-kpi-value">{data.completedCount}</div>
          <div className="odm-cus-kpi-sub">{t.kpiUnit}</div>
        </div>
        <div className="odm-cus-kpi-card">
          <div className="odm-cus-kpi-label">{t.kpi.newMedia}</div>
          <div
            className="odm-cus-kpi-value"
            style={{
              color: data.newMediaCount > 0 ? 'var(--blue-solid)' : undefined,
            }}
          >
            {data.newMediaCount}
          </div>
          <div className="odm-cus-kpi-sub">{t.kpiUnitMedia}</div>
        </div>
      </div>

      {/* Recent orders */}
      <div
        style={{
          background: 'var(--sf)',
          border: '1px solid var(--bd)',
          borderRadius: 10,
          padding: '16px 20px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
            {t.recentOrders}
          </h2>
          <a
            href={customerHref({ screen: 'orders' })}
            style={{
              fontSize: 12,
              color: 'var(--blue-solid)',
              textDecoration: 'none',
            }}
          >
            {t.viewAll}
          </a>
        </div>

        {data.recentOrders.length === 0 ? (
          <EmptyState
            title={t.emptyTitle}
            description={t.emptyDescription}
            action={
              <a
                className="odm-btn odm-btn-p"
                href={customerHref({ screen: 'createOrder' })}
              >
                {t.emptyAction}
              </a>
            }
          />
        ) : (
          <table className="odm-cus-orders-table">
            <thead>
              <tr>
                <th>{t.columns.title}</th>
                <th>{t.columns.address}</th>
                <th>{t.columns.flightDate}</th>
                <th>{t.columns.status}</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => {
                const meta = getOrderStatusMeta(order.status, lang)
                return (
                  <tr key={order.id}>
                    <td>
                      <a
                        href={customerHref({
                          screen: 'orderDetail',
                          orderId: order.id,
                        })}
                        style={{
                          color: 'var(--tx)',
                          textDecoration: 'none',
                          fontWeight: 500,
                        }}
                      >
                        {order.title}
                        {order.hasNewMedia && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: 10,
                              fontWeight: 700,
                              background: 'var(--blue-solid)',
                              color: '#fff',
                              borderRadius: 4,
                              padding: '1px 5px',
                            }}
                          >
                            {t.newMediaBadge}
                          </span>
                        )}
                      </a>
                    </td>
                    <td style={{ color: 'var(--tx3)', fontSize: 12 }}>
                      {order.addressText ?? '—'}
                    </td>
                    <td
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    >
                      {fmtDate(order.preferredDate, locale)}
                    </td>
                    <td>
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
