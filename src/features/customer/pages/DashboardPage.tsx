import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { customerApi } from '../api/customerApi'
import { fmtDate, ORDER_STATUS_META } from '../lib/orderStatus'
import { customerHref } from '../routes'

export function DashboardPage() {
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
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Tổng quan</h1>
        <a className="odm-btn odm-btn-p" href={customerHref({ screen: 'createOrder' })}>
          + Tạo yêu cầu giám sát
        </a>
      </div>

      {/* Live banner */}
      {data.activeLiveMission && (
        <a
          href={customerHref({ screen: 'live', orderId: data.activeLiveMission.orderId })}
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
              ● LIVE
            </span>
            <span style={{ fontWeight: 600, fontSize: 14 }}>
              {data.activeLiveMission.orderTitle}
            </span>
            <span style={{ fontSize: 12, color: 'var(--tx3)' }}>
              {data.activeLiveMission.missionCode}
            </span>
            <span style={{ fontSize: 12, color: 'var(--tx3)', marginLeft: 'auto' }}>
              👥 {data.activeLiveMission.viewerCount} đang xem →
            </span>
          </div>
        </a>
      )}

      {/* KPI cards */}
      <div className="odm-cus-kpi-row">
        <div className="odm-cus-kpi-card">
          <div className="odm-cus-kpi-label">Chờ duyệt</div>
          <div className="odm-cus-kpi-value">{data.pendingCount}</div>
          <div className="odm-cus-kpi-sub">đơn hàng</div>
        </div>
        <div className="odm-cus-kpi-card">
          <div className="odm-cus-kpi-label">Đang thực hiện</div>
          <div className="odm-cus-kpi-value">{data.inProgressCount}</div>
          <div className="odm-cus-kpi-sub">đơn hàng</div>
        </div>
        <div className="odm-cus-kpi-card">
          <div className="odm-cus-kpi-label">Hoàn thành</div>
          <div className="odm-cus-kpi-value">{data.completedCount}</div>
          <div className="odm-cus-kpi-sub">đơn hàng</div>
        </div>
        <div className="odm-cus-kpi-card">
          <div className="odm-cus-kpi-label">Media mới</div>
          <div
            className="odm-cus-kpi-value"
            style={{
              color: data.newMediaCount > 0 ? 'var(--blue-solid)' : undefined,
            }}
          >
            {data.newMediaCount}
          </div>
          <div className="odm-cus-kpi-sub">chờ xem</div>
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
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Đơn hàng gần đây</h2>
          <a
            href={customerHref({ screen: 'orders' })}
            style={{ fontSize: 12, color: 'var(--blue-solid)', textDecoration: 'none' }}
          >
            Xem tất cả →
          </a>
        </div>

        {data.recentOrders.length === 0 ? (
          <EmptyState
            title="Chưa có đơn hàng nào"
            description="Tạo yêu cầu giám sát đầu tiên của bạn."
            action={
              <a className="odm-btn odm-btn-p" href={customerHref({ screen: 'createOrder' })}>
                Tạo yêu cầu đầu tiên →
              </a>
            }
          />
        ) : (
          <table className="odm-cus-orders-table">
            <thead>
              <tr>
                <th>Tiêu đề</th>
                <th>Địa điểm</th>
                <th>Ngày bay</th>
                <th>Trạng thái</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((order) => {
                const meta = ORDER_STATUS_META[order.status]
                return (
                  <tr key={order.id}>
                    <td>
                      <a
                        href={customerHref({ screen: 'orderDetail', orderId: order.id })}
                        style={{ color: 'var(--tx)', textDecoration: 'none', fontWeight: 500 }}
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
                            Media mới
                          </span>
                        )}
                      </a>
                    </td>
                    <td style={{ color: 'var(--tx3)', fontSize: 12 }}>
                      {order.addressText ?? '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {fmtDate(order.preferredDate)}
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
