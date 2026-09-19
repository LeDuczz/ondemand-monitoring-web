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
import { MissionsListPage } from './pages/MissionsListPage'
import { OrderReviewPage } from './pages/OrderReviewPage'
import { QueuePage } from './pages/QueuePage'
import { SchedulePage } from './pages/SchedulePage'
import {
  managerHref,
  managerScreenCode,
  parseManagerRoute,
  type ManagerRoute,
} from './routes'

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
  orderQueue: 'Duyệt đơn',
  orderReview: 'Duyệt đơn',
  missionCreate: 'Mission',
  missionDispatch: 'Mission',
  schedule: 'Lịch mission',
  live: 'Giám sát realtime',
  missions: 'Mission',
  drones: 'Đội drone',
  maintenance: 'Bảo trì',
  media: 'Media và giao kết quả',
  reports: 'Báo cáo',
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
        pendingOrders: data.navCounts.pendingOrders,
        openMaintenance: data.navCounts.openMaintenanceTickets,
        mediaNeedsAction: data.navCounts.mediaNeedsAction,
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
  if (route.screen === 'schedule') return <SchedulePage />
  if (route.screen === 'live') return <LivePage missionId={route.missionId} />
  if (route.screen === 'missions')
    return <MissionsListPage missionId={route.missionId} />
  if (route.screen === 'drones') return <DronesPage droneId={route.droneId} />
  if (route.screen === 'maintenance') return <MaintenancePage />

  if (route.screen === 'notFound') {
    return (
      <StateView
        state="empty"
        title="Không tìm thấy màn hình"
        description="Đường dẫn này không tồn tại trong khu vực Manager."
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

  return (
    <StateView
      state="empty"
      title="Màn hình đang được xây dựng"
      description={`${managerScreenCode[route.screen]} sẽ có ở pha tiếp theo.`}
    />
  )
}
