import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../../auth/api/authApi'
import { LogoutButton } from '../../auth/components/LogoutButton'
import { AiChatWidget } from '../../../shared/components/AiChatWidget'
import { managerHref, type ManagerRoute, type ManagerScreen } from '../routes'
import { ManagerIcon, type ManagerIconName } from './ManagerIcon'
import '../manager.css'

type NavItem = {
  label: string
  icon: ManagerIconName
  route: ManagerRoute
  /** Key into `counts` for the numeric badge, when this item has one. */
  countKey?: 'pendingOrders' | 'openMaintenance' | 'mediaNeedsAction'
}

type NavGroup = { label: string; items: NavItem[] }

// Groups + items copied from the sidebar markup shared by every MNG-*.dc.html
// screen (checked against MNG-01/02/06). The design's sidebar also lists a
// "Thông báo" item (SYS-06, badge 4) inside "Phân tích" — omitted here on
// purpose: SYS-06 Notifications is out of scope for this phase [PLAN §8],
// and rendering a nav link with no destination screen would be a dead link.
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Điều hành',
    items: [
      { label: 'Dashboard', icon: 'dashboard', route: { screen: 'dashboard' } },
      {
        label: 'Duyệt đơn',
        icon: 'order-queue',
        route: { screen: 'orderQueue' },
        countKey: 'pendingOrders',
      },
      { label: 'Mission', icon: 'mission', route: { screen: 'missions' } },
      {
        label: 'Lịch mission',
        icon: 'schedule',
        route: { screen: 'schedule' },
      },
      { label: 'Giám sát realtime', icon: 'live', route: { screen: 'live' } },
    ],
  },
  {
    label: 'Nguồn lực',
    items: [
      { label: 'Đội drone', icon: 'drones', route: { screen: 'drones' } },
      {
        label: 'Bảo trì',
        icon: 'maintenance',
        route: { screen: 'maintenance' },
        countKey: 'openMaintenance',
      },
      {
        label: 'Media và giao kết quả',
        icon: 'media',
        route: { screen: 'media' },
        countKey: 'mediaNeedsAction',
      },
    ],
  },
  {
    label: 'Phân tích',
    items: [
      { label: 'Báo cáo', icon: 'reports', route: { screen: 'reports' } },
    ],
  },
]

// Which nav item highlights as active for each parsed screen — screens that
// aren't reachable directly from the sidebar (order review, mission
// create/dispatch) highlight the item their flow started from.
const activeNavLabel: Record<ManagerScreen, string> = {
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
  notFound: '',
}

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export type ManagerNavCounts = {
  pendingOrders?: number
  openMaintenance?: number
  mediaNeedsAction?: number
}

export function ManagerLayout({
  route,
  breadcrumb,
  counts,
  children,
}: {
  route: ManagerRoute
  breadcrumb: string
  counts?: ManagerNavCounts
  children: ReactNode
}) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const user = authSession.getUser()

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const activeLabel = activeNavLabel[route.screen]

  return (
    <div className="odm odm-mgr">
      <div className="odm-mgr-shell">
        <nav
          aria-label="Điều hướng chính"
          className={`odm-mgr-side ${menuOpen ? 'is-open' : ''}`}
        >
          <a
            className="odm-mgr-brand"
            href={managerHref({ screen: 'dashboard' })}
          >
            <img src="/images/logo-new.png" alt="OnDemand Monitor" className="odm-mgr-brand-mark" />
            <span className="odm-mgr-brand-name">
              <span className="odm-mgr-brand-primary">OnDemand</span>
              <span className="odm-mgr-brand-accent">Monitor</span>
            </span>
          </a>

          <div className="odm-mgr-nav-scroll">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="odm-mgr-navg">{group.label}</div>
                {group.items.map((item) => {
                  const active = item.label === activeLabel
                  const count = item.countKey
                    ? counts?.[item.countKey]
                    : undefined
                  return (
                    <a
                      key={item.label}
                      href={managerHref(item.route)}
                      className={`odm-mgr-navi ${active ? 'is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      <ManagerIcon name={item.icon} />
                      <span>{item.label}</span>
                      {typeof count === 'number' && count > 0 ? (
                        <span className="odm-mgr-navc">{count}</span>
                      ) : null}
                    </a>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="odm-mgr-user">
            <span className="odm-mgr-avatar" aria-hidden="true">
              {initialsOf(user?.fullName)}
            </span>
            <span className="odm-mgr-user-text">
              <span className="odm-mgr-user-name">
                {user?.fullName ?? 'Manager'}
              </span>
              <span className="odm-mgr-user-email">{user?.email ?? ''}</span>
            </span>
          </div>
          <LogoutButton className="odm-mgr-logout" />
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="odm-mgr-scrim"
            aria-label="Đóng điều hướng"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-mgr-main">
          <header className="odm-mgr-topbar">
            <button
              type="button"
              className="odm-mgr-menu-toggle"
              aria-label="Mở điều hướng"
              onClick={() => setMenuOpen(true)}
            >
              <ManagerIcon name="menu" />
            </button>
            <div className="odm-mgr-breadcrumb">{breadcrumb}</div>
            <div className="odm-mgr-topbar-spacer" />
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1"
              aria-label="Đổi giao diện sáng / tối"
              onClick={() => setDark((value) => !value)}
            >
              <ManagerIcon name={dark ? 'sun' : 'moon'} />
            </button>
          </header>
          <main className="odm-mgr-content">{children}</main>
        </div>
      </div>
      <AiChatWidget />
    </div>
  )
}
