import { useEffect, useState } from 'react'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { Button } from '../../../shared/components/Button'
import { useI18n } from '../../../shared/i18n'
import { orderApi, type OrderCreateResponse } from '../../customer/api/orderApi'
import { localizeTimeslot } from '../../manager/lib/viLabels'
import { staffRequestQueuePageMessages } from './StaffRequestQueuePage.messages'

export function StaffRequestQueuePage() {
  const { t } = useI18n(staffRequestQueuePageMessages)
  const [orders, setOrders] = useState<OrderCreateResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await orderApi.getPendingOrders()
      setOrders(data || [])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.loadFailed)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleApprove = async (orderId: string) => {
    try {
      await orderApi.approveOrder(orderId)
      fetchOrders()
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : t.approveFailed)
    }
  }

  return (
    <PortalLayout role="MANAGER" title={t.title} subtitle={t.subtitle}>
      <section className="portal-panel">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 20,
          }}
        >
          <h2>{t.pendingOrders}</h2>
          <Button onClick={fetchOrders}>{t.refresh}</Button>
        </div>

        {loading ? (
          <p>{t.loading}</p>
        ) : error ? (
          <p style={{ color: 'var(--red-text)' }}>{error}</p>
        ) : orders.length === 0 ? (
          <p>{t.noOrders}</p>
        ) : (
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              textAlign: 'left',
            }}
          >
            <thead>
              <tr
                style={{
                  borderBottom: '2px solid var(--border)',
                  color: 'var(--text-3)',
                }}
              >
                <th style={{ padding: '12px 8px' }}>{t.orderId}</th>
                <th style={{ padding: '12px 8px' }}>{t.orderTitle}</th>
                <th style={{ padding: '12px 8px' }}>{t.customer}</th>
                <th style={{ padding: '12px 8px' }}>{t.preferredDate}</th>
                <th style={{ padding: '12px 8px' }}>{t.location}</th>
                <th style={{ padding: '12px 8px', width: '120px' }}>
                  {t.actions}
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id}
                  style={{ borderBottom: '1px solid var(--border)' }}
                >
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>
                    {order.id}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <strong>{order.title}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {order.serviceName}
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>
                    {order.customerName || order.customerId}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>
                    {[order.preferredDateFrom, order.preferredDateTo]
                      .filter(Boolean)
                      .join(' → ')}
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {localizeTimeslot(order.preferredTimeName)}
                    </div>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>
                    {order.address}
                  </td>
                  <td style={{ padding: '12px 8px' }}>
                    <Button onClick={() => handleApprove(order.id)}>
                      {t.approve}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </PortalLayout>
  )
}
