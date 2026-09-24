import { useState } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import type { OrderStatus } from '../../../shared/types/domain'
import { customerApi } from '../api/customerApi'
import { fmtDate, ORDER_STATUS_META } from '../lib/orderStatus'
import { customerHref } from '../routes'

type FilterOption = { label: string; value: OrderStatus | '' }

const FILTERS: FilterOption[] = [
  { label: 'Tất cả', value: '' },
  { label: 'Nháp', value: 'DRAFT' },
  { label: 'Đã phân tích AI', value: 'AI_ANALYZED' },
  { label: 'Đã gửi duyệt', value: 'SUBMITTED' },
  { label: 'Đang duyệt', value: 'PENDING' },
  { label: 'Đã duyệt', value: 'APPROVED' },
  { label: 'Đã lên lịch', value: 'SCHEDULED' },
  { label: 'Đang thực hiện', value: 'IN_PROGRESS' },
  { label: 'Hoàn thành', value: 'COMPLETED' },
  { label: 'Từ chối', value: 'REJECTED' },
  { label: 'Đã huỷ', value: 'CANCELLED' },
]

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')

  const { data, loading, error, reload } = useApiQuery(
    (signal) => customerApi.listOrders({ status: statusFilter || undefined, signal }),
    [statusFilter],
  )

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Đơn của tôi</h1>
        <a className="odm-btn odm-btn-p" href={customerHref({ screen: 'createOrder' })}>
          + Tạo yêu cầu
        </a>
      </div>

      <div className="odm-cus-filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            className={`odm-btn ${statusFilter === f.value ? 'odm-btn-p' : 'odm-btn-gh'}`}
            onClick={() => setStatusFilter(f.value as OrderStatus | '')}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && <LoadingState />}

      {!loading && (error || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}

      {!loading && data && data.items.length === 0 && (
        <EmptyState
          title="Không có đơn hàng"
          description={
            statusFilter
              ? 'Không có đơn ở trạng thái này.'
              : 'Bạn chưa có đơn hàng nào.'
          }
          action={
            <a className="odm-btn odm-btn-p" href={customerHref({ screen: 'createOrder' })}>
              Tạo yêu cầu giám sát
            </a>
          }
        />
      )}

      {!loading && data && data.items.length > 0 && (
        <div
          style={{
            background: 'var(--sf)',
            border: '1px solid var(--bd)',
            borderRadius: 10,
            overflow: 'hidden',
          }}
        >
          <table className="odm-cus-orders-table">
            <thead>
              <tr>
                <th>Mã đơn</th>
                <th>Tiêu đề</th>
                <th>Địa điểm</th>
                <th>Ngày bay</th>
                <th>Dịch vụ</th>
                <th>Bán kính</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((order) => {
                const meta = ORDER_STATUS_META[order.status]
                return (
                  <tr key={order.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx3)' }}>
                      {order.orderCode}
                    </td>
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
                    <td style={{ fontSize: 12 }}>
                      {order.serviceNames.join(', ') || '—'}
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {order.radiusM != null ? `${order.radiusM} m` : '—'}
                    </td>
                    <td>
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    </td>
                    <td>
                      <a
                        href={customerHref({ screen: 'orderDetail', orderId: order.id })}
                        style={{ fontSize: 12, color: 'var(--blue-solid)', textDecoration: 'none' }}
                      >
                        Xem
                      </a>
                      {(order.status === 'DRAFT' || order.status === 'AI_ANALYZED') && (
                        <>
                          {' · '}
                          <a
                            href={customerHref({ screen: 'analysis', orderId: order.id })}
                            style={{ fontSize: 12, color: 'var(--blue-solid)', textDecoration: 'none' }}
                          >
                            AI
                          </a>
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
