import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { customerHref, type CustomerRoute, type CustomerScreen } from './routes'
import './customer.css'

type NavItem = {
  label: string
  icon: string
  route: CustomerRoute
  newMediaBadge?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Tổng quan', icon: '⊞', route: { screen: 'dashboard' } },
  { label: 'Đơn của tôi', icon: '≡', route: { screen: 'orders' } },
  { label: 'Tạo yêu cầu', icon: '+', route: { screen: 'createOrder' } },
  { label: 'Thư viện kết quả', icon: '⊟', route: { screen: 'mediaLibrary' }, newMediaBadge: true },
  { label: 'Thông báo', icon: '🔔', route: { screen: 'notifications' } },
]

const activeScreen: Record<CustomerScreen, string> = {
  dashboard: 'Tổng quan',
  orders: 'Đơn của tôi',
  createOrder: 'Tạo yêu cầu',
  orderDetail: 'Đơn của tôi',
  analysis: 'Đơn của tôi',
  live: 'Xem trực tiếp',
  liveHub: 'Xem trực tiếp',
  media: 'Thư viện kết quả',
  mediaLibrary: 'Thư viện kết quả',
  mediaDetail: 'Thư viện kết quả',
  notifications: 'Thông báo',
  notFound: '',
}

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export function CustomerLayout({
  route,
  breadcrumb,
  newMediaCount,
  children,
}: {
  route: CustomerRoute
  breadcrumb: string
  newMediaCount?: number
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
    <div className="odm odm-cus">
      <div className="odm-cus-shell">
        <nav
          aria-label="Điều hướng khách hàng"
          className={`odm-cus-side ${menuOpen ? 'is-open' : ''}`}
        >
          <a className="odm-cus-brand" href={customerHref({ screen: 'dashboard' })}>
            <span className="odm-cus-brand-mark" aria-hidden="true">
              ✦
            </span>
            <span>
              <span className="odm-cus-brand-name">OnDemand Monitor</span>
              <span className="odm-cus-brand-sub">Cổng khách hàng</span>
            </span>
          </a>

          <div className="odm-cus-nav-scroll">
            <div className="odm-cus-navg">Menu</div>
            {NAV_ITEMS.map((item) => {
              const isActive = item.label === active
              const badge =
                item.newMediaBadge && (newMediaCount ?? 0) > 0
                  ? newMediaCount
                  : undefined
              return (
                <a
                  key={item.label}
                  href={customerHref(item.route)}
                  className={`odm-cus-navi ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <span aria-hidden="true" style={{ fontStyle: 'normal', minWidth: 16, textAlign: 'center' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {badge ? <span className="odm-cus-navc">{badge}</span> : null}
                </a>
              )
            })}
          </div>

          <div className="odm-cus-user">
            <span className="odm-cus-avatar" aria-hidden="true">
              {initialsOf(user?.fullName)}
            </span>
            <span className="odm-cus-user-text">
              <span className="odm-cus-user-name">{user?.fullName ?? 'Khách hàng'}</span>
              <span className="odm-cus-user-email">{user?.email ?? ''}</span>
            </span>
          </div>
          <LogoutButton className="odm-cus-logout" />
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="odm-cus-scrim"
            aria-label="Đóng điều hướng"
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-cus-main">
          <header className="odm-cus-topbar">
            <button
              type="button"
              className="odm-cus-menu-toggle"
              aria-label="Mở điều hướng"
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <div className="odm-cus-breadcrumb">{breadcrumb}</div>
            <div className="odm-cus-topbar-spacer" />
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1"
              aria-label="Đổi giao diện sáng / tối"
              onClick={() => setDark((v) => !v)}
            >
              {dark ? '☀' : '☾'}
            </button>
          </header>
          <main className="odm-cus-content">{children}</main>
        </div>
      </div>
    </div>
  )
}
