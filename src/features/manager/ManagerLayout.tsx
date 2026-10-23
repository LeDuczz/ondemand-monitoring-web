import { useEffect, useState, type ReactNode } from 'react'

import { useI18n } from '../../shared/i18n'
import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { managerHref, type ManagerRoute, type ManagerScreen } from './routes'
import {
  ManagerIcon,
  type ManagerIconName,
} from './components/common/ManagerIcon'
import './manager.css'
import { Button } from '../../shared/components/ui'
import { managerLayoutMessages } from './ManagerLayout.messages'

type SidebarKey = keyof (typeof managerLayoutMessages)['vi']['sidebar']

type NavItem = {
  label: SidebarKey
  icon: ManagerIconName
  route?: ManagerRoute
  href?: string
  /** Key into `counts` for the numeric badge, when this item has one. */
  countKey?: 'pendingOrders'
}

type NavGroup = { label: SidebarKey; items: NavItem[] }

// Groups + items copied from the sidebar markup shared by every MNG-*.dc.html
const NAV_GROUPS: NavGroup[] = [
  {
    label: 'groupOperations',
    items: [
      { label: 'dashboard', icon: 'dashboard', route: { screen: 'dashboard' } },
      {
        label: 'orders',
        icon: 'order-queue',
        route: { screen: 'orderQueue' },
        countKey: 'pendingOrders',
      },
      {
        label: 'missions',
        icon: 'mission',
        route: { screen: 'missions' },
      },
      {
        label: 'schedule',
        icon: 'schedule',
        route: { screen: 'schedule' },
      },
    ],
  },
  {
    label: 'groupSupport',
    items: [
      {
        label: 'support',
        icon: 'reports',
        href: '#portal/manager/support',
      },
    ],
  },
  {
    label: 'groupResources',
    items: [
      { label: 'drones', icon: 'drones', route: { screen: 'drones' } },
      {
        label: 'maintenance',
        icon: 'maintenance',
        route: { screen: 'maintenance' },
      },
    ],
  },
]

// Which nav item highlights as active for each parsed screen — screens that
// aren't reachable directly from the sidebar (order review, mission
// create/dispatch) highlight the item their flow started from.
const activeNavLabel: Record<ManagerScreen, SidebarKey | ''> = {
  dashboard: 'dashboard',
  orderQueue: 'orders',
  orderReview: 'orders',
  missionCreate: 'orders',
  missionDispatch: 'missions',
  missionSetup: 'missions',
  missionDetail: 'missions',
  schedule: 'schedule',
  missions: 'missions',
  drones: 'drones',
  maintenance: 'maintenance',
  support: 'support',
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

  const activeLabel = activeNavLabel[route.screen]

  return (
    <div className="odm odm-mgr">
      <div className="odm-mgr-shell">
        <nav
          aria-label={t.nav}
          className={`odm-mgr-side ${menuOpen ? 'is-open' : ''}`}
        >
          <a
            className="odm-mgr-brand"
            href={managerHref({ screen: 'dashboard' })}
          >
            <img
              src="/images/logo-new.png"
              alt="OnDemand Monitor"
              className="odm-mgr-brand-mark"
            />
            <span className="odm-mgr-brand-name">
              <span className="odm-mgr-brand-primary">OnDemand</span>
              <span className="odm-mgr-brand-accent">Monitor</span>
            </span>
          </a>

          <div className="odm-mgr-nav-scroll">
            {NAV_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="odm-mgr-navg">{t.sidebar[group.label]}</div>
                {group.items.map((item) => {
                  const active = item.label === activeLabel
                  const count = item.countKey
                    ? counts?.[item.countKey]
                    : undefined
                  return (
                    <a
                      key={item.label}
                      href={
                        item.href ||
                        (item.route ? managerHref(item.route) : '#')
                      }
                      className={`odm-mgr-navi ${active ? 'is-active' : ''}`}
                      aria-current={active ? 'page' : undefined}
                      onClick={() => setMenuOpen(false)}
                    >
                      <ManagerIcon name={item.icon} />
                      <span>{t.sidebar[item.label]}</span>
                      {typeof count === 'number' && count > 0 ? (
                        <span className="odm-mgr-navc">{count}</span>
                      ) : null}
                    </a>
                  )
                })}
              </div>
            ))}
          </div>

          <a
            href="#profile"
            className="odm-mgr-user"
            style={{ color: 'inherit', textDecoration: 'none' }}
          >
            <span className="odm-mgr-avatar" aria-hidden="true">
              {initialsOf(user?.fullName)}
            </span>
            <span className="odm-mgr-user-text">
              <span className="odm-mgr-user-name">
                {user?.fullName ?? t.manager}
              </span>
              <span className="odm-mgr-user-email">{user?.email ?? ''}</span>
            </span>
          </a>
          <LogoutButton className="odm-mgr-logout" />
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="odm-mgr-scrim"
            aria-label={t.closeNav}
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-mgr-main">
          <header className="odm-mgr-topbar">
            <button
              type="button"
              className="odm-mgr-menu-toggle"
              aria-label={t.openNav}
              onClick={() => setMenuOpen(true)}
            >
              <ManagerIcon name="menu" />
            </button>
            <div className="odm-mgr-breadcrumb">{breadcrumb}</div>
            <div className="odm-mgr-topbar-spacer" />
            <Button
              href="#portal/manager/support"
              variant="ghost"
              style={{
                fontSize: 13,
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: 8,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                marginRight: 8,
              }}
            >
              {t.sidebar.supportButton}
            </Button>
            <Button
              type="button"
              variant="ghost"
              aria-label={t.toggleTheme}
              onClick={() => setDark((value) => !value)}
            >
              <ManagerIcon name={dark ? 'sun' : 'moon'} />
            </Button>
          </header>
          <main className="odm-mgr-content">{children}</main>
        </div>
      </div>
    </div>
  )
}
