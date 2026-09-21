import { useEffect, useState } from 'react'
import { PortalLayout } from '../../../shared/components/portal/PortalLayout'
import { Button } from '../../../shared/components/Button'
import { orderApi, type OrderCreateResponse } from '../../customer/api/orderApi'

export function StaffRequestQueuePage() {
  const [orders, setOrders] = useState<OrderCreateResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await orderApi.getPendingOrders()
      setOrders(data || [])
    } catch (e: any) {
      setError(e.message || 'Failed to fetch pending orders')
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
    } catch (e: any) {
      alert(e.message || 'Approval failed')
    }
  }

  return (
    <PortalLayout
      role="STAFF"
      title="Request queue"
      subtitle="Review incoming monitoring requests and approve them to create missions."
    >
      <section className="portal-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2>Pending Orders</h2>
          <Button onClick={fetchOrders}>Refresh</Button>
        </div>

        {loading ? (
          <p>Loading pending requests...</p>
        ) : error ? (
          <p style={{ color: 'var(--red-text)' }}>{error}</p>
        ) : orders.length === 0 ? (
          <p>No pending orders in the queue.</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-3)' }}>
                <th style={{ padding: '12px 8px' }}>Order ID</th>
                <th style={{ padding: '12px 8px' }}>Title</th>
                <th style={{ padding: '12px 8px' }}>Customer</th>
                <th style={{ padding: '12px 8px' }}>Preferred Date</th>
                <th style={{ padding: '12px 8px' }}>Location</th>
                <th style={{ padding: '12px 8px', width: '120px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{order.id}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <strong>{order.title}</strong>
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{order.serviceName}</div>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{order.customerName || order.customerId}</td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>
                    {order.preferredDate}
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{order.preferredTimeName}</div>
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 13 }}>{order.address}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <Button onClick={() => handleApprove(order.id)}>Approve</Button>
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

