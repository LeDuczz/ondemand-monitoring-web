import { LanguageToggle } from '../../shared/components/LanguageToggle'
import { useI18n } from '../../shared/i18n'
import { operatorHref } from './routes'
import { operatorTopbarMessages } from './OperatorTopbar.messages'

export function OperatorTopbar({
  breadcrumb,
  dark,
  onToggleDark,
  searchQuery,
  onSearchChange,
}: {
  breadcrumb: string
  dark: boolean
  onToggleDark: () => void
  searchQuery: string
  onSearchChange: (value: string) => void
}) {
  const { t } = useI18n(operatorTopbarMessages)
  return (
    <header className="odm-opr-topbar">
      <a className="odm-opr-brand" href={operatorHref({ screen: 'missions' })}>
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

      <div className="odm-opr-breadcrumb">
        <span>{t.pilotLabel}</span>
        <span aria-hidden="true">›</span>
        <strong>{breadcrumb}</strong>
      </div>

      <div className="odm-opr-topbar-actions">
        <a
          href={operatorHref({ screen: 'maintenance' })}
          className="odm-btn"
          style={{
            fontSize: 13,
            fontWeight: 600,
            padding: '6px 14px',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          {t.maintenanceLink}
        </a>

        <div className="odm-opr-search">
          <span className="odm-opr-search-icon" aria-hidden="true">
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="M20 20l-4.2-4.2" />
            </svg>
          </span>
          <input
            className="odm-inp"
            aria-label={t.search}
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <LanguageToggle />
        <button
          type="button"
          className="odm-btn odm-btn-gh odm-btn-ic1"
          aria-label={t.toggleTheme}
          onClick={onToggleDark}
        >
          {dark ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
