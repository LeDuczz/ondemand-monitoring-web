export function GuardStateCard({
  tone,
  eyebrow,
  title,
  description,
  statusRole,
  primaryAction,
  secondaryAction,
}: {
  tone: 'blue' | 'amber'
  eyebrow: string
  title: string
  description: string
  statusRole: 'status' | 'alert'
  primaryAction?: { label: string; href: string }
  secondaryAction?: { label: string; onClick: () => void }
}) {
  const color =
    tone === 'amber'
      ? {
          bg: '#fff7ed',
          border: '#fed7aa',
          strong: '#9a3412',
          soft: '#c2410c',
          chipBg: '#ffedd5',
        }
      : {
          bg: '#eff6ff',
          border: '#bfdbfe',
          strong: '#1d4ed8',
          soft: '#2563eb',
          chipBg: '#dbeafe',
        }

  return (
    <section
      role={statusRole}
      style={{
        minHeight: 'calc(100vh - 150px)',
        display: 'grid',
        placeItems: 'center',
        padding: '40px 18px',
      }}
    >
      <div
        style={{
          width: 'min(560px, 100%)',
          borderRadius: 14,
          border: `1px solid ${color.border}`,
          background: '#fff',
          boxShadow: '0 18px 50px rgba(15, 23, 42, .08)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '22px 24px',
            background: color.bg,
            borderBottom: `1px solid ${color.border}`,
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 26,
              padding: '0 10px',
              borderRadius: 999,
              background: color.chipBg,
              color: color.strong,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
            }}
          >
            {eyebrow}
          </span>
          <h1
            style={{
              margin: '12px 0 0',
              fontSize: 22,
              lineHeight: 1.25,
              color: 'var(--tx)',
            }}
          >
            {title}
          </h1>
          <p
            style={{
              margin: '8px 0 0',
              color: 'var(--tx2)',
              fontSize: 14,
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>
        </div>
        {(primaryAction || secondaryAction) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 10,
              padding: '16px 24px',
              flexWrap: 'wrap',
            }}
          >
            {secondaryAction && (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="odm-btn"
                style={{ minWidth: 128 }}
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <a
                href={primaryAction.href}
                className="odm-btn odm-btn-p"
                style={{ minWidth: 150, textDecoration: 'none' }}
              >
                {primaryAction.label}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
