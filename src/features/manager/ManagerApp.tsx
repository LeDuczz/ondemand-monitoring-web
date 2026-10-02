import { useEffect, useState } from 'react'

import { StateView } from '../../shared/components/odm/StateView'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { managerApi } from './api/dashboardApi'
import { ManagerLayout } from './components/ManagerLayout'
import { CreateMissionPage } from './pages/CreateMissionPage'
import { DashboardPage } from './pages/DashboardPage'
import { DispatchPage } from './pages/DispatchPage'
import { DronesPage } from './pages/DronesPage'
import { LivePage } from './pages/LivePage'
import { MaintenancePage } from './pages/MaintenancePage'
import { MediaPage } from './pages/MediaPage'
import { MissionDetailPage } from './pages/MissionDetailPage'
import { MissionsListPage } from './pages/MissionsListPage'
import { ReportsPage } from './pages/ReportsPage'
import { OrderReviewPage } from './pages/OrderReviewPage'
import { QueuePage } from './pages/QueuePage'
import { SchedulePage } from './pages/SchedulePage'
import { StaffSupportDashboardPage } from '../support/pages/StaffSupportDashboardPage'
import { managerHref, parseManagerRoute, type ManagerRoute } from './routes'

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
  live: 'Giám sát realtime',
  missions: 'Nhiệm vụ',
  drones: 'Đội drone',
  maintenance: 'Bảo trì',
  media: 'Media và giao kết quả',
  reports: 'Báo cáo',
  support: 'Trung tâm Hỗ trợ',
  notFound: 'Không tìm thấy',
}

/**
 * Root of the Manager (role STAFF) area. Parses `#portal/staff...` hashes
 * into a `ManagerRoute` and renders the matching screen inside
 * `ManagerLayout`. Only MNG-01 (Dashboard) is implemented in this phase;
 * every other screen renders a temporary "đang được xây dựng" placeholder
 * that later phases (P4-P8) will replace.
 *
 * Fetches the dashboard once here (rather than inside `DashboardPage`) so
 * the sidebar nav-count badges (Duyệt đơn / Bảo trì / Media) stay populated
 * from real API data on every screen, not just the dashboard itself.
 */
export function ManagerApp() {
  const hash = useHash()
  const route = parseManagerRoute(hash)
  const navCounts = useApiQuery((signal) => managerApi.getDashboard(signal), [])

  const data = navCounts.data
  // Nav badges come from the dashboard's (PROPOSED) `navCounts` field, not
  // from counting `actionItems` — that list only surfaces the handful of
  // items needing attention right now, which undercounts the real totals
  // (Bảo trì / Media). `navCounts` values are backed by design strings from
  // MNG-10/MNG-11, not invented — see the type doc in
  // src/features/manager/types/dashboard.ts and evd/P3-manager-dashboard.md.
  const counts = data
    ? {
      pendingOrders: data.navCounts?.pendingOrders ?? 0,
      openMaintenance: data.navCounts?.openMaintenanceTickets ?? 0,
      mediaNeedsAction: data.navCounts?.mediaNeedsAction ?? 0,
    }
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
  if (route.screen === 'orderQueue') return <QueuePage />
  if (route.screen === 'orderReview')
    return <OrderReviewPage orderId={route.orderId} />
  if (route.screen === 'missionCreate')
    return <CreateMissionPage orderId={route.orderId} />
  if (route.screen === 'missionDispatch')
    return <DispatchPage missionId={route.missionId} />
  if (route.screen === 'missionSetup')
    return <DispatchPage missionId={route.missionId} setupMode />
  if (route.screen === 'missionDetail')
    return <MissionDetailPage missionId={route.missionId} />
  if (route.screen === 'schedule') return <SchedulePage />
  if (route.screen === 'live') return <LivePage missionId={route.missionId} />
  if (route.screen === 'missions')
    return <MissionsListPage missionId={route.missionId} />
  if (route.screen === 'drones') return <DronesPage droneId={route.droneId} />
  if (route.screen === 'maintenance') return <MaintenancePage />
  if (route.screen === 'media') return <MediaPage />
  if (route.screen === 'reports') return <ReportsPage />
  if (route.screen === 'support') return <StaffSupportDashboardPage />

  // route.screen === 'notFound'
  return (
    <StateView
      state="empty"
      title="Không tìm thấy màn hình"
      description="Đường dẫn này không tồn tại trong khu vực Staff."
      action={
        <a
          className="odm-btn odm-btn-p"
          href={managerHref({ screen: 'dashboard' })}
        >
          Về Dashboard
        </a>
      }
    />
  )
}
