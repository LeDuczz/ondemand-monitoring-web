import { useEffect, useState, type ReactNode } from 'react'

import { authApi, authSession } from '../../../features/auth/api/authApi'
import { getRoleHomePath } from '../../../features/auth/routing'
import type { UserRole } from '../../../features/auth/types'
import { Icon, type IconName } from '../Icon'

type PortalNavItem = { label: string; icon: IconName; href: string }

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: 'Customer workspace',
  STAFF: 'Operations workspace',
  DRONE_OPERATOR: 'Drone operations',
  SYSTEM_OPERATOR: 'System operations',
  ADMIN: 'Administration',
}

const navItems: Record<UserRole, PortalNavItem[]> = {
  CUSTOMER: [
    { label: 'Overview', icon: 'chart', href: '#portal/customer' },
    { label: 'Create request', icon: 'plus', href: '#portal/customer/request' },
    { label: 'My requests', icon: 'ticket', href: '#portal/customer/requests' },
    { label: 'Reports', icon: 'file-text', href: '#portal/customer/reports' },
  ],
  STAFF: [
    { label: 'Operations overview', icon: 'chart', href: '#portal/staff' },
    { label: 'Request queue', icon: 'ticket', href: '#portal/staff/queue' },
    { label: 'Assignments', icon: 'users', href: '#portal/staff/assignments' },
    { label: 'Schedule', icon: 'clock', href: '#portal/staff/schedule' },
  ],
  DRONE_OPERATOR: [
    { label: 'Mission console', icon: 'route', href: '#portal/drone-operator' },
    {
      label: 'Preflight checks',
      icon: 'shield',
      href: '#portal/drone-operator/preflight',
    },
    { label: 'Telemetry', icon: 'activity', href: '#portal/drone-operator' },
  ],
  SYSTEM_OPERATOR: [
    {
      label: 'System overview',
      icon: 'chart',
      href: '#portal/system-operator',
    },
    {
      label: 'Devices',
      icon: 'radio',
      href: '#portal/system-operator/devices',
    },
    {
      label: 'Telemetry',
      icon: 'activity',
      href: '#portal/system-operator/telemetry',
    },
    { label: 'Alerts', icon: 'shield', href: '#portal/system-operator/alerts' },
  ],
  ADMIN: [
    { label: 'Admin overview', icon: 'chart', href: '#portal/admin' },
    { label: 'Users', icon: 'users', href: '#portal/admin/users' },
    { label: 'Missions', icon: 'route', href: '#portal/admin/missions' },
    { label: 'Audit logs', icon: 'clipboard', href: '#portal/admin/audit' },
  ],
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

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  const logout = async () => {
    const token = authSession.getAccessToken()
    try {
      if (token) await authApi.logout(token)
    } finally {
      authSession.clear()
      window.location.hash = '#auth/login'
    }
  }

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
        <div className="portal-role-label">{roleLabels[role]}</div>
        <nav className="portal-nav" aria-label="Portal navigation">
          {navItems[role].map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="portal-sidebar-footer">
          <button
            type="button"
            className="portal-utility-button"
            onClick={() => setDark(!dark)}
          >
            <Icon name={dark ? 'sun' : 'moon'} />
            <span>{dark ? 'Light mode' : 'Dark mode'}</span>
          </button>
          <button
            type="button"
            className="portal-utility-button"
            onClick={logout}
          >
            <Icon name="arrow-left" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
      {menuOpen ? (
        <button
          className="portal-scrim"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
      <main className="portal-main">
        <header className="portal-header">
          <button
            className="portal-menu-toggle"
            type="button"
            aria-label="Open navigation"
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div>
            <p className="eyebrow">{roleLabels[role]}</p>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className="portal-user-chip">
            <span className="portal-avatar">
              {user?.fullName?.slice(0, 1).toUpperCase() ?? 'F'}
            </span>
            <span>
              <strong>{user?.fullName ?? 'Fieldwise user'}</strong>
              <small>{user?.email ?? role}</small>
            </span>
          </div>
        </header>
        <div className="portal-content">{children}</div>
      </main>
    </div>
  )
}
