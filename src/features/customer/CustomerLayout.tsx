import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import { LanguageToggle } from '../../shared/components/LanguageToggle'
import { useI18n } from '../../shared/i18n'
import { CustomerChatbot } from './components/CustomerChatbot'
import { customerHref, type CustomerRoute, type CustomerScreen } from './routes'
import { customerLayoutMessages } from './CustomerLayout.messages'
import './customer.css'

type NavItemKey = keyof typeof customerLayoutMessages.vi.navItems

type NavItem = {
  key: NavItemKey
  icon: string
  route?: CustomerRoute
  href?: string
  newMediaBadge?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { key: 'missionHistory', icon: '◷', route: { screen: 'missionHistory' } },
  { key: 'dashboard', icon: '⊞', route: { screen: 'dashboard' } },
  { key: 'orders', icon: '≡', route: { screen: 'orders' } },
  { key: 'createOrder', icon: '+', route: { screen: 'createOrder' } },
  {
    key: 'mediaLibrary',
    icon: '⊟',
    route: { screen: 'mediaLibrary' },
    newMediaBadge: true,
  },
  { key: 'help', icon: '❓', href: '#help' },
  { key: 'support', icon: '🎫', href: '#help/tickets' },
  { key: 'notifications', icon: '🔔', route: { screen: 'notifications' } },
]

const activeNavKey: Record<CustomerScreen, NavItemKey | null> = {
  missionHistory: 'missionHistory',
  missionHistoryDetail: 'missionHistory',
  dashboard: 'dashboard',
  orders: 'orders',
  createOrder: 'createOrder',
  orderDetail: 'orders',
  analysis: 'orders',
  live: null,
  liveHub: null,
  media: 'mediaLibrary',
  mediaLibrary: 'mediaLibrary',
  mediaDetail: 'mediaLibrary',
  notifications: 'notifications',
  notFound: null,
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
  const { t } = useI18n(customerLayoutMessages)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const activeKey = activeNavKey[route.screen]

  return (
    <div className="odm odm-cus">
      <div className="odm-cus-shell">
        <nav
          aria-label={t.nav}
          className={`odm-cus-side ${menuOpen ? 'is-open' : ''}`}
        >
          <a
            className="odm-cus-brand"
            href={customerHref({ screen: 'dashboard' })}
          >
            <img
              src="/images/logo-new.png"
              alt="OnDemand Monitor"
              className="odm-cus-brand-mark"
            />
            <span className="odm-cus-brand-name">
              <span className="odm-cus-brand-primary">OnDemand</span>
              <span className="odm-cus-brand-accent">Monitor</span>
            </span>
          </a>

          <div className="odm-cus-nav-scroll">
            <div className="odm-cus-navg">{t.menu}</div>
            {NAV_ITEMS.map((item) => {
              const isActive = item.key === activeKey
              const badge =
                item.newMediaBadge && (newMediaCount ?? 0) > 0
                  ? newMediaCount
                  : undefined
              return (
                <a
                  key={item.key}
                  href={item.href || (item.route ? customerHref(item.route) : '#')}
                  className={`odm-cus-navi ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      fontStyle: 'normal',
                      minWidth: 16,
                      textAlign: 'center',
                    }}
                  >
                    {item.icon}
                  </span>
                  <span>{t.navItems[item.key]}</span>
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
              <span className="odm-cus-user-name">
                {user?.fullName ?? t.customer}
              </span>
              <span className="odm-cus-user-email">{user?.email ?? ''}</span>
            </span>
          </div>
          <LogoutButton className="odm-cus-logout" />
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="odm-cus-scrim"
            aria-label={t.closeNav}
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-cus-main">
          <header className="odm-cus-topbar">
            <button
              type="button"
              className="odm-cus-menu-toggle"
              aria-label={t.openNav}
              onClick={() => setMenuOpen(true)}
            >
              ☰
            </button>
            <div className="odm-cus-breadcrumb">{breadcrumb}</div>
            <div className="odm-cus-topbar-spacer" />
            <a
              href="#help"
              className="odm-btn odm-btn-gh"
              style={{ fontSize: 13, textDecoration: 'none', padding: '6px 12px', borderRadius: 8, display: 'inline-flex', alignItems: 'center', gap: 6, marginRight: 8 }}
            >
              ❓ Trợ giúp & Hỗ trợ
            </a>
            <LanguageToggle />
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1"
              aria-label={t.toggleTheme}
              onClick={() => setDark((v) => !v)}
            >
              {dark ? '☀' : '☾'}
            </button>
          </header>
          <main className="odm-cus-content">{children}</main>
          <CustomerChatbot />
        </div>
      </div>
    </div>
  )
}
