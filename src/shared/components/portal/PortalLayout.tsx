import { useEffect, useState, type ReactNode } from 'react'

import { authSession } from '../../../features/auth/api/authApi'
import { LogoutButton } from '../../../features/auth/components/LogoutButton'
import { getRoleHomePath } from '../../../features/auth/routing'
import type { UserRole } from '../../../features/auth/types'
import { Icon, type IconName } from '../Icon'
import { LanguageToggle } from '../LanguageToggle'
import { useI18n } from '../../i18n'
import { portalLayoutMessages } from './PortalLayout.messages'

type PortalNavItem = { icon: IconName; href: string }

// Labels are translated (see PortalLayout.messages.ts, same order as here);
// icon + href stay as plain data.
const navItems: Record<UserRole, PortalNavItem[]> = {
  CUSTOMER: [
    { icon: 'chart', href: '#portal/customer' },
    { icon: 'plus', href: '#portal/customer/request' },
    { icon: 'ticket', href: '#portal/customer/requests' },
    { icon: 'file-text', href: '#portal/customer/reports' },
  ],
  STAFF: [
    { icon: 'chart', href: '#portal/staff' },
    { icon: 'ticket', href: '#portal/staff/queue' },
    { icon: 'users', href: '#portal/staff/assignments' },
    { icon: 'clock', href: '#portal/staff/schedule' },
  ],
  DRONE_OPERATOR: [
    { icon: 'route', href: '#portal/drone-operator' },
    { icon: 'shield', href: '#portal/drone-operator/preflight' },
    { icon: 'activity', href: '#portal/drone-operator' },
  ],
  SYSTEM_OPERATOR: [
    { icon: 'chart', href: '#portal/system-operator' },
    { icon: 'ticket', href: '#portal/system-operator/maintenance' },
    { icon: 'radio', href: '#portal/system-operator/devices' },
    { icon: 'activity', href: '#portal/system-operator/telemetry' },
    { icon: 'shield', href: '#portal/system-operator/alerts' },
  ],
  ADMIN: [
    { icon: 'chart', href: '#portal/admin' },
    { icon: 'users', href: '#portal/admin/accounts/new' },
    { icon: 'route', href: '#portal/admin/missions' },
    { icon: 'clipboard', href: '#portal/admin/audit' },
  ],
  AUDITOR: [{ icon: 'clipboard', href: '#portal/admin/audit-log' }],
}

export function PortalLayout({
  role,
  title,
  subtitle,
  children,
}: {
  role: UserRole
  title: string
  subtitle: string
  children: ReactNode
}) {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const user = authSession.getUser()
  const { t } = useI18n(portalLayoutMessages)

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const labels = t.navLabels[role]

  return (
    <div className="portal-shell">
      <aside
        className={`portal-sidebar ${menuOpen ? 'portal-sidebar--open' : ''}`}
      >
        <a className="portal-brand" href={getRoleHomePath(role)}>
          <span className="brand-mark" aria-hidden="true">
            <span />
          </span>
          <span>FIELDWISE</span>
        </a>
        <div className="portal-role-label">{t.roleLabels[role]}</div>
        <nav className="portal-nav" aria-label={t.nav}>
          {navItems[role].map((item, index) => (
            <a
              key={`${item.href}-${index}`}
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{labels[index]}</span>
            </a>
          ))}
        </nav>
        <div className="portal-sidebar-footer">
          <LanguageToggle className="portal-utility-button" />
          <button
            type="button"
            className="portal-utility-button"
            onClick={() => setDark(!dark)}
          >
            <Icon name={dark ? 'sun' : 'moon'} />
            <span>{dark ? t.lightMode : t.darkMode}</span>
          </button>
          <LogoutButton className="portal-logout-button" />
        </div>
      </aside>
      {menuOpen ? (
        <button
          className="portal-scrim"
          aria-label={t.closeNav}
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <main className="portal-main">
        <header className="portal-header">
          <button
            className="portal-menu-toggle"
            type="button"
            aria-label={t.openNav}
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div>
            <p className="eyebrow">{t.roleLabels[role]}</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="portal-user-chip">
            <span className="portal-avatar">
              {user?.fullName?.slice(0, 1).toUpperCase() ?? 'F'}
            </span>
            <span>
              <strong>{user?.fullName ?? t.fieldwiseUser}</strong>
              <small>{user?.email ?? role}</small>
            </span>
          </div>
          <LanguageToggle />
        </header>
        <div className="portal-content">{children}</div>
      </main>
    </div>
  )
}
