import { operatorHref } from './routes'

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
  return (
    <header className="odm-opr-topbar">
      <a className="odm-opr-brand" href={operatorHref({ screen: 'missions' })}>
        <span className="odm-opr-brand-mark" aria-hidden="true">
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="9" y="9" width="6" height="6" rx="1.5" />
            <path d="M9.5 9.5L6.5 6.5M14.5 9.5l3-3M9.5 14.5l-3 3M14.5 14.5l3 3" />
            <circle cx="5" cy="5" r="2.3" />
            <circle cx="19" cy="5" r="2.3" />
            <circle cx="5" cy="19" r="2.3" />
            <circle cx="19" cy="19" r="2.3" />
          </svg>
        </span>
        <span>
          <span className="odm-opr-brand-name">OnDemand Monitor</span>
          <span className="odm-opr-brand-sub">Phi công · web</span>
        </span>
      </a>

      <div className="odm-opr-breadcrumb">
        <span>Phi công</span>
        <span aria-hidden="true">›</span>
        <strong>{breadcrumb}</strong>
      </div>

      <div className="odm-opr-topbar-actions">
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
            aria-label="Tìm kiếm"
            placeholder="Tìm mã đơn, mission, drone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="odm-btn odm-btn-gh odm-btn-ic1"
          aria-label="Đổi giao diện sáng / tối"
          onClick={onToggleDark}
        >
          {dark ? '☀' : '☾'}
        </button>
      </div>
    </header>
  )
}
