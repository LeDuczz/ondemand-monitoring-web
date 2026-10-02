import { useEffect, useState, type ReactNode } from 'react'

import { LanguageToggle } from '../../shared/components/LanguageToggle'
import { useI18n } from '../../shared/i18n'
import { authSession } from '../auth/api/authApi'
import { LogoutButton } from '../auth/components/LogoutButton'
import '../drone-operator/opr.css'
import './sysop.css'
import { systemOperatorLayoutMessages } from './SystemOperatorLayout.messages'

type NavKey = keyof (typeof systemOperatorLayoutMessages)['vi']['nav']

const NAV: Array<{ key: NavKey; icon: string; href: string }> = [
  { key: 'overview', icon: '▦', href: '#portal/system-operator' },
  { key: 'maintenance', icon: '🛠', href: '#portal/system-operator/maintenance' },
  { key: 'devices', icon: '◉', href: '#portal/system-operator/devices' },
  { key: 'telemetry', icon: '〰', href: '#portal/system-operator/telemetry' },
  { key: 'alerts', icon: '🔔', href: '#portal/system-operator/alerts' },
]

function activeKey(hash: string): NavKey {
  const found = NAV.slice(1).find((item) => hash.startsWith(item.href))
  return found ? found.key : 'overview'
}

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/** Shell for the System Operator portal — same look as the Operator/Manager portals. */
export function SystemOperatorLayout({
  title,
  subtitle,
  children,
}: {
  title?: string
  subtitle?: string
  children: ReactNode
}) {
  const { t } = useI18n(systemOperatorLayoutMessages)
  const [hash, setHash] = useState(() => window.location.hash)
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )
  const [menuOpen, setMenuOpen] = useState(false)
  const user = authSession.getUser()
  const active = activeKey(hash)

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  return (
    <div className="odm odm-opr">
      <div className="odm-opr-shell">
        <nav
          aria-label={t.ariaNav}
          className={`odm-opr-side${menuOpen ? ' is-open' : ''}`}
        >
          <a
            className="odm-opr-brand"
            href="#portal/system-operator"
            onClick={() => setMenuOpen(false)}
          >
            <img
              src="/images/logo-new.png"
              alt="OnDemand Monitor"
              className="odm-opr-brand-mark"
            />
            <span className="odm-opr-brand-name">
              <span className="odm-opr-brand-primary">OnDemand</span>
              <span className="odm-opr-brand-accent">Monitor</span>
            </span>
          </a>

          <div className="odm-opr-nav-scroll">
            <div className="odm-opr-navg">{t.group}</div>
            {NAV.map((item) => {
              const isActive = item.key === active
              return (
                <a
                  key={item.key}
                  href={item.href}
                  className={`odm-opr-navi ${isActive ? 'is-active' : ''}`}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                >
                  <span
                    aria-hidden="true"
                    style={{ minWidth: 16, textAlign: 'center' }}
                  >
                    {item.icon}
                  </span>
                  <span>{t.nav[item.key]}</span>
                </a>
              )
            })}
          </div>

          <div className="odm-opr-user">
            <span className="odm-opr-avatar" aria-hidden="true">
              {initialsOf(user?.fullName)}
            </span>
            <span className="odm-opr-user-text">
              <span className="odm-opr-user-name">
                {user?.fullName ?? t.userFallback}
              </span>
              <span className="odm-opr-user-email">{user?.email ?? ''}</span>
            </span>
          </div>
          <LogoutButton className="odm-opr-logout" />
        </nav>

        {menuOpen ? (
          <button
            type="button"
            className="odm-opr-scrim"
            aria-label={t.closeMenu}
            onClick={() => setMenuOpen(false)}
          />
        ) : null}

        <div className="odm-opr-main">
          <header className="odm-opr-topbar">
            <button
              type="button"
              className="odm-opr-menu-toggle"
              aria-label={t.openMenu}
              onClick={() => setMenuOpen(true)}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                aria-hidden="true"
              >
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </button>
            <div className="odm-opr-breadcrumb">
              <span>{t.roleLabel}</span>
              <span aria-hidden="true">›</span>
              <strong>{t.nav[active]}</strong>
            </div>
            <div className="odm-opr-topbar-actions">
              <LanguageToggle />
              <button
                type="button"
                className="odm-btn odm-btn-gh odm-btn-ic1"
                aria-label={t.toggleTheme}
                onClick={() => setDark((v) => !v)}
              >
                {dark ? '☀' : '☾'}
              </button>
            </div>
          </header>
          <main className="odm-opr-content">
            {title ? (
              <div className="odm-sysop-pagehead">
                <h1>{title}</h1>
                {subtitle ? <p>{subtitle}</p> : null}
              </div>
            ) : null}
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
