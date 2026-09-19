import { useEffect, useState } from 'react'

import { StateView } from '../../shared/components/odm/StateView'
import { useApiQuery } from '../../shared/hooks/useApiQuery'
import { managerApi } from './api/dashboardApi'
import { ManagerLayout } from './components/ManagerLayout'
import { DashboardPage } from './pages/DashboardPage'
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
  missionCreate: 'Duyệt đơn',
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
  // Nav badges come straight from the dashboard payload — no separate
  // "total open tickets" / "total media needing action" endpoint exists yet
  // (MNG-10/MNG-11 land in a later phase), so Bảo trì / Media count only the
  // items already surfaced in "Cần xử lý ngay" rather than inventing a
  // bigger number to match the design's static mock (3 / 6 there come from
  // screens this phase doesn't build). See evd/P3-manager-dashboard.md.
  const counts = data
    ? {
        pendingOrders: data.kpis.pendingOrders.count,
        openMaintenance: data.actionItems.filter(
          (item) => item.type === 'MAINTENANCE_TICKET',
        ).length,
        mediaNeedsAction: data.actionItems.filter(
          (item) => item.type === 'MEDIA_ACTION',
        ).length,
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
