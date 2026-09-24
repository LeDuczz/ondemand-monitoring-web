import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { Icon } from '../../shared/components/Icon'
import { adminHref, type AdminRoute, type AdminScreen } from './routes'
import './admin.css'

type NavItem = { label: string; icon: string; route: AdminRoute; pendingBadge?: boolean }

const NAV_ITEMS: NavItem[] = [
  { label: 'Người dùng', icon: '◉', route: { screen: 'accounts' } },
  { label: 'Vai trò', icon: '◈', route: { screen: 'roles' } },
  { label: 'Danh mục', icon: '▦', route: { screen: 'catalog' } },
  { label: 'Cấu hình vận hành', icon: '⚙', route: { screen: 'operatingConfig' } },
  { label: 'Tri thức AI và luật', icon: '◆', route: { screen: 'aiKnowledge' } },
  { label: 'Nhật ký hệ thống', icon: '◎', route: { screen: 'auditLog' } },
]

const activeScreen: Record<AdminScreen, string> = {
  dashboard: 'Tổng quan',
  accounts: 'Người dùng',
  createAccount: 'Người dùng',
  accountDetail: 'Người dùng',
  roles: 'Vai trò',
  catalog: 'Danh mục',
  operatingConfig: 'Cấu hình vận hành',
  aiKnowledge: 'Tri thức AI và luật',
  auditLog: 'Nhật ký hệ thống',
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
          <a className="odm-adm-brand" href={adminHref({ screen: 'accounts' })}>
            <img src="/images/logo-new.png" alt="" className="odm-adm-brand-mark" />
            <span>
              <span className="odm-adm-brand-name">OnDemand Monitor</span>
              <span className="odm-adm-brand-sub">Quản trị viên</span>
            </span>
          </a>

          <div className="odm-adm-nav-scroll">
            <div className="odm-adm-navg">Menu</div>
            {NAV_ITEMS.map((item) => {
              const isActive = item.label === active
              const badge = item.label === 'Người dùng' && (pendingCount ?? 0) > 0
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
            <div className="odm-adm-search">
              <Icon name="search" width={15} height={15} className="odm-adm-search-icon" />
              <input
                className="odm-inp odm-adm-search-input"
                type="search"
                aria-label="Tìm kiếm"
                placeholder="Tìm mã đơn, mission, drone..."
              />
            </div>
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1"
              aria-label="Đổi giao diện sáng / tối"
              onClick={() => setDark((v) => !v)}
            >
              {dark ? '☀' : '☾'}
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1 odm-adm-bell"
              aria-label="Thông báo"
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
