import { EmptyState } from '../../../shared/components/odm/StateView'

export function NotificationsPage() {
  return (
    <div>
      <h1 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 700 }}>Thông báo</h1>
      <EmptyState
        title="Chưa có thông báo"
        description="Các thông báo về đơn hàng và lần bay sẽ xuất hiện ở đây."
      />
    </div>
  )
}
