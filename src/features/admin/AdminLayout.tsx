import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { Icon } from '../../shared/components/Icon'
import { LanguageToggle } from '../../shared/components/LanguageToggle'
import { useI18n } from '../../shared/i18n'
import { adminHref, type AdminRoute, type AdminScreen } from './routes'
import { adminLayoutMessages } from './AdminLayout.messages'
import './admin.css'

type NavItemKey = keyof typeof adminLayoutMessages.vi.navItems

type NavItem = { key: NavItemKey; icon: string; route: AdminRoute }

const NAV_ITEMS: NavItem[] = [
  { key: 'accounts', icon: '◉', route: { screen: 'accounts' } },
  { key: 'roles', icon: '◈', route: { screen: 'roles' } },
  { key: 'catalog', icon: '▦', route: { screen: 'catalog' } },
  { key: 'operatingConfig', icon: '⚙', route: { screen: 'operatingConfig' } },
  { key: 'aiKnowledge', icon: '◆', route: { screen: 'aiKnowledge' } },
  { key: 'auditLog', icon: '◎', route: { screen: 'auditLog' } },
]

// Which nav item highlights as active for each parsed screen.
const activeNavKey: Record<AdminScreen, NavItemKey | null> = {
  dashboard: null,
  accounts: 'accounts',
  createAccount: 'accounts',
  accountDetail: 'accounts',
  roles: 'roles',
  catalog: 'catalog',
  operatingConfig: 'operatingConfig',
  aiKnowledge: 'aiKnowledge',
  auditLog: 'auditLog',
  notFound: null,
}

function initialsOf(name: string | undefined): string {
  if (!name) return '?'
  const words = name.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function AdminLayout({
  route,
  breadcrumb,
  pendingCount,
  children,
}: {
  route: AdminRoute
  breadcrumb: string
  pendingCount?: number
  children: ReactNode
}) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const user = authSession.getUser()
  const { t } = useI18n(adminLayoutMessages)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const activeKey = activeNavKey[route.screen]

  return (
    <div className="odm odm-adm">
      <div className="odm-adm-shell">
        <nav
          aria-label={t.nav}
          className={`odm-adm-side ${menuOpen ? 'is-open' : ''}`}
        >
          <a className="odm-adm-brand" href={adminHref({ screen: 'accounts' })}>
            <img
              src="/images/logo-new.png"
              alt="OnDemand Monitor"
              className="odm-adm-brand-mark"
            />
            <span className="odm-adm-brand-name">
              <span className="odm-adm-brand-primary">OnDemand</span>
              <span className="odm-adm-brand-accent">Monitor</span>
            </span>
          </a>

          <div className="odm-adm-nav-scroll">
            <div className="odm-adm-navg">{t.menu}</div>
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activeKey
              const badge =
                item.key === 'accounts' && (pendingCount ?? 0) > 0
                  ? pendingCount
                  : undefined
              return (
                <a
                  key={item.key}
                  href={adminHref(item.route)}
                  className={`odm-adm-navi ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <span
                    aria-hidden="true"
                    style={{ minWidth: 16, textAlign: 'center' }}
                  >
                    {item.icon}
                  </span>
                  <span>{t.navItems[item.key]}</span>
                  {badge ? <span className="odm-adm-navc">{badge}</span> : null}
                </a>
              )
            })}
          </div>

          <div className="odm-adm-user">
            <span className="odm-adm-avatar" aria-hidden="true">
              {initialsOf(user?.fullName)}
            </span>
            <span className="odm-adm-user-text">
              <span className="odm-adm-user-name">
                {user?.fullName ?? t.admin}
              </span>
              <span className="odm-adm-user-email">{user?.email ?? ''}</span>
            </span>
          </div>
          <LogoutButton className="odm-adm-logout" />
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="odm-adm-scrim"
            aria-label={t.closeNav}
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-adm-main">
          <header className="odm-adm-topbar">
            <button
              type="button"
              className="odm-adm-menu-toggle"
              aria-label={t.openNav}
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <div className="odm-adm-breadcrumb">{breadcrumb}</div>
            <div className="odm-adm-topbar-spacer" />
            <div className="odm-adm-search">
              <Icon
                name="search"
                width={15}
                height={15}
                className="odm-adm-search-icon"
              />
              <input
                className="odm-inp odm-adm-search-input"
                type="search"
                aria-label={t.search}
                placeholder={t.searchPlaceholder}
              />
            </div>
            <LanguageToggle />
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1"
              aria-label={t.toggleTheme}
              onClick={() => setDark((v) => !v)}
            >
              {dark ? '☀' : '☾'}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1 odm-adm-bell"
              aria-label={t.notifications}
            >
              <Icon name="bell" width={17} height={17} />
              <span className="odm-adm-bell-dot" aria-hidden="true" />
            </button>
          </header>
          <main className="odm-adm-content">{children}</main>
        </div>
      </div>
    </div>
  )
}
