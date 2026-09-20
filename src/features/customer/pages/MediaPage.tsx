import { EmptyState } from '../../../shared/components/odm/StateView'
import { customerHref } from '../routes'

export function MediaPage({ orderId }: { orderId: string }) {
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
        title="Thư viện media (CUS-07)"
        description="Tính năng xem ảnh/video kết quả đang được phát triển."
      />
    </div>
  )
}
