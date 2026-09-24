import { EmptyState } from '../../../shared/components/odm/StateView'
import { customerHref } from '../routes'

export function LivePage({ orderId }: { orderId: string }) {
  return (
    <div>
      <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--tx3)' }}>
        <a
          href={customerHref({ screen: 'orderDetail', orderId })}
          style={{ color: 'var(--tx3)', textDecoration: 'none' }}
        >
          ← Quay lại đơn hàng
        </a>
      </div>
      <EmptyState
        title="Giám sát realtime (CUS-06)"
        description="Tính năng xem trực tiếp đang được phát triển."
      />
    </div>
  )
}
