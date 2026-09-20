import { useEffect, useState } from 'react'

import { EmptyState } from '../../shared/components/odm/StateView'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { customerApi } from './api/customerApi'
import { CustomerLayout } from './CustomerLayout'
import { AnalysisPage } from './pages/AnalysisPage'
import { CreateOrderPage } from './pages/CreateOrderPage'
import { DashboardPage } from './pages/DashboardPage'
import { LivePage } from './pages/LivePage'
import { MediaPage } from './pages/MediaPage'
import { OrderDetailPage } from './pages/OrderDetailPage'
import { OrdersPage } from './pages/OrdersPage'
import { customerHref, parseCustomerRoute, type CustomerRoute } from './routes'

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}

const breadcrumbLabel: Record<CustomerRoute['screen'], string> = {
  dashboard: 'Tổng quan',
  orders: 'Đơn của tôi',
  createOrder: 'Tạo yêu cầu',
  orderDetail: 'Chi tiết đơn hàng',
  analysis: 'Phân tích AI',
  live: 'Giám sát realtime',
  media: 'Thư viện media',
  notFound: 'Không tìm thấy',
}

export function CustomerApp() {
  const hash = useHash()
  const route = parseCustomerRoute(hash)

  const dashboard = useApiQuery((signal) => customerApi.getDashboard(signal), [])
  const newMediaCount = dashboard.data?.newMediaCount

  return (
    <CustomerLayout
      route={route}
      breadcrumb={breadcrumbLabel[route.screen]}
      newMediaCount={newMediaCount}
    >
      {renderScreen(route)}
    </CustomerLayout>
  )
}

function renderScreen(route: CustomerRoute) {
  if (route.screen === 'dashboard') return <DashboardPage />
  if (route.screen === 'orders') return <OrdersPage />
  if (route.screen === 'createOrder') return <CreateOrderPage />
  if (route.screen === 'orderDetail')
    return <OrderDetailPage orderId={route.orderId} />
  if (route.screen === 'analysis')
    return <AnalysisPage orderId={route.orderId} />
  if (route.screen === 'live') return <LivePage orderId={route.orderId} />
  if (route.screen === 'media') return <MediaPage orderId={route.orderId} />

  return (
    <EmptyState
      title="Không tìm thấy màn hình"
      description="Đường dẫn này không tồn tại trong cổng khách hàng."
      action={
        <a className="odm-btn odm-btn-p" href={customerHref({ screen: 'dashboard' })}>
          Về Tổng quan
        </a>
      }
    />
  )
}
