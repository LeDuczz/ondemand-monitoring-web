import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { adminHref, type AdminRoute, type AdminScreen } from './routes'
import './admin.css'

type NavItem = { label: string; icon: string; route: AdminRoute; pendingBadge?: boolean }

const NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', icon: '⊞', route: { screen: 'dashboard' } },
  { label: 'Tài khoản', icon: '👤', route: { screen: 'accounts' } },
]

const activeScreen: Record<AdminScreen, string> = {
  dashboard: 'Tổng quan',
  accounts: 'Tài khoản',
  createAccount: 'Tài khoản',
  accountDetail: 'Tài khoản',
  notFound: '',
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

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const active = activeScreen[route.screen]

  return (
    <div className="odm odm-adm">
      <div className="odm-adm-shell">
        <nav
          aria-label="Điều hướng quản trị"
          className={`odm-adm-side ${menuOpen ? 'is-open' : ''}`}
        >
          <a className="odm-adm-brand" href={adminHref({ screen: 'dashboard' })}>
            <span className="odm-adm-brand-mark" aria-hidden="true">⚙</span>
            <span>
              <span className="odm-adm-brand-name">OnDemand Monitor</span>
              <span className="odm-adm-brand-sub">Quản trị hệ thống</span>
            </span>
          </a>

          <div className="odm-adm-nav-scroll">
            <div className="odm-adm-navg">Menu</div>
            {NAV_ITEMS.map((item) => {
              const isActive = item.label === active
              const badge = item.label === 'Tài khoản' && (pendingCount ?? 0) > 0
                ? pendingCount
                : undefined
              return (
                <a
                  key={item.label}
                  href={adminHref(item.route)}
                  className={`odm-adm-navi ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <span aria-hidden="true" style={{ minWidth: 16, textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
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
              <span className="odm-adm-user-name">{user?.fullName ?? 'Admin'}</span>
              <span className="odm-adm-user-email">{user?.email ?? ''}</span>
            </span>
          </div>
          <LogoutButton className="odm-adm-logout" />
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="odm-adm-scrim"
            aria-label="Đóng điều hướng"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-adm-main">
          <header className="odm-adm-topbar">
            <button
              type="button"
              className="odm-adm-menu-toggle"
              aria-label="Mở điều hướng"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <div className="odm-adm-breadcrumb">{breadcrumb}</div>
            <div className="odm-adm-topbar-spacer" />
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1"
              aria-label="Đổi giao diện sáng / tối"
              onClick={() => setDark((v) => !v)}
            >
              {dark ? '☀' : '☾'}
            </button>
          </header>
          <main className="odm-adm-content">{children}</main>
        </div>
      </div>
    </div>
  )
}
