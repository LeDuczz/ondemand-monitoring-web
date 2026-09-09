import { useEffect, useState } from 'react'
import '../styles/global.css'

import { LandingPage } from '../features/landing/pages/LandingPage'
import { OperatorDashboardPage } from '../features/mission/pages/OperatorDashboardPage'
import { Icon } from '../shared/components/Icon'

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
    </span>
  )
}

function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark'
  )
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])
  return (
    <button
      className="icon-button"
      type="button"
      aria-label={`Switch to ${dark ? 'light' : 'dark'} mode`}
      onClick={() => setDark(!dark)}
    >
      <Icon name={dark ? 'sun' : 'moon'} />
    </button>
  )
}

export function Router() {
  const [currentView, setCurrentView] = useState<'landing' | 'operator'>('operator')

  return (
    <div>
      {/* Universal Enterprise Header */}
      <header
        style={{
          background: 'var(--color-surface)',
          borderBottom: '1px solid var(--color-border)',
          padding: '16px 0',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <BrandMark />
            <span style={{ fontSize: '0.85rem', fontWeight: 800, letterSpacing: '0.12em', color: 'var(--color-foreground)' }}>
              FIELDWISE SYSTEMS
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '4px', background: 'var(--color-surface-muted)', padding: '4px', borderRadius: '10px', border: '1px solid var(--color-border)' }}>
              <button
                onClick={() => setCurrentView('landing')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '7px',
                  border: 'none',
                  background: currentView === 'landing' ? 'var(--color-primary)' : 'transparent',
                  color: currentView === 'landing' ? '#ffffff' : 'var(--color-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon name="file-text" style={{ width: '14px' }} />
                <span>Landing Page</span>
              </button>

              <button
                onClick={() => setCurrentView('operator')}
                style={{
                  padding: '8px 16px',
                  borderRadius: '7px',
                  border: 'none',
                  background: currentView === 'operator' ? 'var(--color-primary)' : 'transparent',
                  color: currentView === 'operator' ? '#ffffff' : 'var(--color-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Icon name="route" style={{ width: '14px' }} />
                <span>Operator Dashboard (Flow 3)</span>
              </button>
            </div>

            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main View Container */}
      <main>
        {currentView === 'landing' ? <LandingPage /> : <OperatorDashboardPage />}
      </main>
    </div>
  )
}
