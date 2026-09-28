import { useState } from 'react'

import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import type { OrderStatus } from '../../../shared/types/domain'
import { customerApi } from '../api/customerApi'
import { fmtDate, getOrderStatusMeta } from '../lib/orderStatus'
import { customerHref } from '../routes'
import { ordersPageMessages } from './OrdersPage.messages'

type FilterOption = {
  key: keyof typeof ordersPageMessages.vi.filters
  value: OrderStatus | ''
}

const FILTERS: FilterOption[] = [
  { key: 'all', value: '' },
  { key: 'DRAFT', value: 'DRAFT' },
  { key: 'AI_ANALYZED', value: 'AI_ANALYZED' },
  { key: 'SUBMITTED', value: 'SUBMITTED' },
  { key: 'PENDING', value: 'PENDING' },
  { key: 'APPROVED', value: 'APPROVED' },
  { key: 'SCHEDULED', value: 'SCHEDULED' },
  { key: 'IN_PROGRESS', value: 'IN_PROGRESS' },
  { key: 'COMPLETED', value: 'COMPLETED' },
  { key: 'REJECTED', value: 'REJECTED' },
  { key: 'CANCELLED', value: 'CANCELLED' },
]

export function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const { t, lang, locale } = useI18n(ordersPageMessages)

  const { data, loading, error, reload } = useApiQuery(
    (signal) =>
      customerApi.listOrders({ status: statusFilter || undefined, signal }),
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
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{t.title}</h1>
        <a
          className="odm-btn odm-btn-p"
          href={customerHref({ screen: 'createOrder' })}
        >
          {t.createOrder}
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
            {t.filters[f.key]}
          </button>
        ))}
      </div>

      {loading && <LoadingState />}

      {!loading && (error || !data) && (
        <ErrorState error={error} onRetry={reload} />
      )}

      {!loading && data && data.items.length === 0 && (
        <EmptyState
          title={t.emptyTitle}
          description={statusFilter ? t.emptyFiltered : t.emptyAll}
          action={
            <a
              className="odm-btn odm-btn-p"
              href={customerHref({ screen: 'createOrder' })}
            >
              {t.emptyAction}
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
                <th>{t.columns.code}</th>
                <th>{t.columns.title}</th>
                <th>{t.columns.address}</th>
                <th>{t.columns.flightDate}</th>
                <th>{t.columns.service}</th>
                <th>{t.columns.radius}</th>
                <th>{t.columns.status}</th>
                <th>{t.columns.actions}</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((order) => {
                const meta = getOrderStatusMeta(order.status, lang)
                return (
                  <tr key={order.id}>
                    <td
                      style={{
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--tx3)',
                      }}
                    >
                      {order.orderCode}
                    </td>
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
                    <td style={{ fontSize: 12 }}>
                      {order.serviceNames.join(', ') || '—'}
                    </td>
                    <td
                      style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}
                    >
                      {order.radiusM != null ? `${order.radiusM} m` : '—'}
                    </td>
                    <td>
                      <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                    </td>
                    <td>
                      <a
                        href={customerHref({
                          screen: 'orderDetail',
                          orderId: order.id,
                        })}
                        style={{
                          fontSize: 12,
                          color: 'var(--blue-solid)',
                          textDecoration: 'none',
                        }}
                      >
                        {t.view}
                      </a>
                      {(order.status === 'DRAFT' ||
                        order.status === 'AI_ANALYZED') && (
                        <>
                          {' · '}
                          <a
                            href={customerHref({
                              screen: 'analysis',
                              orderId: order.id,
                            })}
                            style={{
                              fontSize: 12,
                              color: 'var(--blue-solid)',
                              textDecoration: 'none',
                            }}
                          >
                            {t.ai}
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
