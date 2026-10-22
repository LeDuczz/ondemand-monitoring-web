import { useEffect, useState } from 'react'

import { StateView } from '../../shared/components/odm/StateView'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { managerApi } from './api/dashboardApi'
import { ManagerLayout } from './ManagerLayout'
import { MissionCreatePage } from './pages/MissionCreate'
import { DashboardPage } from './pages/Dashboard'
import { MissionDispatchPage } from './pages/MissionDispatch'
import { DronesPage } from './pages/Drones'
import { MaintenancePage } from './pages/Maintenance'
import { MissionDetailPage } from './pages/MissionDetail'
import { MissionsPage } from './pages/Missions'
import { OrderReviewPage } from './pages/OrderReview'
import { OrderQueuePage } from './pages/OrderQueue'
import { SchedulePage } from './pages/Schedule'
import { StaffSupportDashboardPage } from '../support/pages/StaffSupportDashboardPage'
import { managerHref, parseManagerRoute, type ManagerRoute } from './routes'
import { Button } from '../../shared/components/ui'

function useHash(): string {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}

const breadcrumbLabel: Record<ManagerRoute['screen'], string> = {
  dashboard: 'Dashboard',
  orderQueue: 'Đơn hàng',
  orderReview: 'Đơn hàng',
  missionCreate: 'Đơn hàng',
  missionDispatch: 'Nhiệm vụ',
  missionSetup: 'Thiết lập nhiệm vụ',
  missionDetail: 'Chi tiết nhiệm vụ',
  schedule: 'Lịch nhiệm vụ',
  missions: 'Nhiệm vụ',
  drones: 'Đội drone',
  maintenance: 'Bảo trì',
  support: 'Trung tâm Hỗ trợ',
  notFound: 'Không tìm thấy',
}

/**
 * Root of the Manager (role MANAGER) area. Parses `#portal/manager...` hashes
 * into a `ManagerRoute` and renders the matching screen inside
 * `ManagerLayout`. Only MNG-01 (Dashboard) is implemented in this phase;
 * every other screen renders a temporary "đang được xây dựng" placeholder
 * that later phases (P4-P8) will replace.
 *
 * Fetches the dashboard once here (rather than inside `DashboardPage`) so
 * the sidebar pending-orders badge stays populated from real API data on
 * every screen, not just the dashboard itself.
 */
export function ManagerApp() {
  const hash = useHash()
  const route = parseManagerRoute(hash)
  const navCounts = useApiQuery((signal) => managerApi.getDashboard('30D', signal), [])

  const counts = navCounts.data?.summary
    ? { pendingOrders: navCounts.data.summary.pendingOrderCount }
    : undefined

  return (
    <ManagerLayout
      route={route}
      breadcrumb={breadcrumbLabel[route.screen]}
      counts={counts}
    >
      {renderScreen(route)}
    </ManagerLayout>
  )
}

function renderScreen(route: ManagerRoute) {
  if (route.screen === 'dashboard') return <DashboardPage />
  if (route.screen === 'orderQueue') return <OrderQueuePage />
  if (route.screen === 'orderReview')
    return <OrderReviewPage key={route.orderId} orderId={route.orderId} />
  if (route.screen === 'missionCreate')
    return (
      <MissionCreatePage
        orderId={route.orderId}
        replacesMissionId={route.replacesMissionId}
      />
    )
  if (route.screen === 'missionDispatch')
    return (
      <MissionDispatchPage key={route.missionId} missionId={route.missionId} />
    )
  if (route.screen === 'missionSetup')
    return (
      <MissionDispatchPage
        key={route.missionId}
        missionId={route.missionId}
        setupMode
      />
    )
  if (route.screen === 'missionDetail')
    return <MissionDetailPage missionId={route.missionId} />
  if (route.screen === 'schedule') return <SchedulePage />
  if (route.screen === 'missions')
    return <MissionsPage missionId={route.missionId} />
  if (route.screen === 'drones') return <DronesPage droneId={route.droneId} />
  if (route.screen === 'maintenance') return <MaintenancePage />
  if (route.screen === 'support') return <StaffSupportDashboardPage />

  // route.screen === 'notFound'
  return (
    <StateView
      state="empty"
      title="Không tìm thấy màn hình"
      description="Đường dẫn này không tồn tại trong khu vực Staff."
      action={
        <Button
          variant="primary"
          href={managerHref({ screen: 'dashboard' })}
        >
          Về Dashboard
        </Button>
      }
    />
  )
}
