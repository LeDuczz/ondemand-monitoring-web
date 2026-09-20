import { EmptyState } from '../../../shared/components/odm/StateView'
import { customerHref } from '../routes'

export function AnalysisPage({ orderId }: { orderId: string }) {
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
        title="Phân tích AI (CUS-03)"
        description="Tính năng phân tích kết quả bay đang được phát triển."
      />
    </div>
  )
}
