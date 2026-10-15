import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { LanguageToggle } from '../../shared/components/LanguageToggle'
import { useI18n } from '../../shared/i18n'
import {
  ManagerIcon,
  type ManagerIconName,
} from './components/common/ManagerIcon'
import { managerLayoutMessages } from './ManagerLayout.messages'
import { managerHref, type ManagerRoute, type ManagerScreen } from './routes'
import '../../shared/components/PortalShell/portalShell.css'
import './manager.css'

const SUPPORT_HREF = '#portal/manager/support'

type NavItemKey = keyof typeof managerLayoutMessages.vi.navItems
type GroupKey = keyof typeof managerLayoutMessages.vi.groups

type NavItem = {
  key: NavItemKey
  icon: ManagerIconName
  route?: ManagerRoute
  href?: string
  /** Key into `counts` for the numeric badge, when this item has one. */
  countKey?: 'pendingOrders' | 'openMaintenance'
}

type NavGroup = { key: GroupKey; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  {
    key: 'operations',
    items: [
      { key: 'dashboard', icon: 'dashboard', route: { screen: 'dashboard' } },
      {
        key: 'orderQueue',
        icon: 'order-queue',
        route: { screen: 'orderQueue' },
        countKey: 'pendingOrders',
      },
      { key: 'missions', icon: 'mission', route: { screen: 'missions' } },
      { key: 'schedule', icon: 'schedule', route: { screen: 'schedule' } },
      { key: 'live', icon: 'live', route: { screen: 'live' } },
    ],
  },
  {
    key: 'support',
    items: [{ key: 'support', icon: 'reports', href: SUPPORT_HREF }],
  },
  {
    key: 'resources',
    items: [
      { key: 'drones', icon: 'drones', route: { screen: 'drones' } },
      {
        key: 'maintenance',
        icon: 'maintenance',
        route: { screen: 'maintenance' },
        countKey: 'openMaintenance',
      },
    ],
  },
]

// Which nav item highlights as active for each parsed screen. Screens that
// aren't reachable directly from the sidebar (order review, mission
// create/dispatch) highlight the item their flow started from.
const activeNavKey: Record<ManagerScreen, NavItemKey | null> = {
  dashboard: 'dashboard',
  orderQueue: 'orderQueue',
  orderReview: 'orderQueue',
  missionCreate: 'orderQueue',
  missionDispatch: 'missions',
  missionSetup: 'missions',
  missionDetail: 'missions',
  schedule: 'schedule',
  live: 'live',
  missions: 'missions',
  drones: 'drones',
  maintenance: 'maintenance',
  support: 'support',
  notFound: null,
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
  const { t } = useI18n(managerLayoutMessages)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const activeKey = activeNavKey[route.screen]

  return (
    <div className="odm odm-mgr odm-shell-root">
      <div className="odm-shell-shell">
        <nav
          aria-label={t.nav}
          className={`odm-shell-side ${menuOpen ? 'is-open' : ''}`}
        >
          <a
            className="odm-shell-brand"
            href={managerHref({ screen: 'dashboard' })}
          >
            <img
              src="/images/logo-new.png"
              alt="OnDemand Monitor"
              className="odm-shell-brand-mark"
            />
            <span className="odm-shell-brand-name">
              <span className="odm-shell-brand-primary">OnDemand</span>
              <span className="odm-shell-brand-accent">Monitor</span>
            </span>
          </a>

          <div className="odm-shell-nav-scroll">
            {NAV_GROUPS.map((group) => (
              <div key={group.key}>
                <div className="odm-shell-navg">{t.groups[group.key]}</div>
                {group.items.map((item) => {
                  const active = item.key === activeKey
                  const count = item.countKey
                    ? counts?.[item.countKey]
                    : undefined
                  return (
                    <a
                      key={item.key}
                      href={
                        item.href ||
                        (item.route ? managerHref(item.route) : '#')
                      }
                      className={`odm-shell-navi ${active ? 'is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      <ManagerIcon name={item.icon} />
                      <span>{t.navItems[item.key]}</span>
                      {typeof count === 'number' && count > 0 ? (
                        <span className="odm-shell-navc">{count}</span>
                      ) : null}
                    </a>
                  )
                })}
              </div>
            ))}
          </div>

          <a href="#profile" className="odm-shell-user">
            <span className="odm-shell-avatar" aria-hidden="true">
              {initialsOf(user?.fullName)}
            </span>
            <span className="odm-shell-user-text">
              <span className="odm-shell-user-name">
                {user?.fullName ?? t.staff}
              </span>
              <span className="odm-shell-user-email">{user?.email ?? ''}</span>
            </span>
          </a>
          <LogoutButton className="odm-shell-logout" />
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="odm-shell-scrim"
            aria-label={t.closeNav}
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-shell-main">
          <header className="odm-shell-topbar">
            <button
              type="button"
              className="odm-shell-menu-toggle"
              aria-label={t.openNav}
              onClick={() => setMenuOpen(true)}
            >
              <ManagerIcon name="menu" />
            </button>
            <div className="odm-shell-breadcrumb">{breadcrumb}</div>
            <div className="odm-shell-topbar-spacer" />
            <a href={SUPPORT_HREF} className="odm-btn odm-btn-gh">
              <ManagerIcon name="reports" />
              {t.supportCenter}
            </a>
            <LanguageToggle />
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1"
              aria-label={t.toggleTheme}
              onClick={() => setDark((value) => !value)}
            >
              <ManagerIcon name={dark ? 'sun' : 'moon'} />
            </button>
          </header>
          <main className="odm-shell-content">
            <div className="odm-shell-content-inner">{children}</div>
          </main>
        </div>
      </div>
    </div>
  )
}
