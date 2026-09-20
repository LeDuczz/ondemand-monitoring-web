import { useState } from 'react'
import { authSession } from '../../../auth/api/authApi'
import { LogoutButton } from '../../../auth/components/LogoutButton'

function initialsOf(fullName: string | undefined): string {
  if (!fullName) return '?'
  const words = fullName.trim().split(/\s+/)
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

export default function OperatorUserMenu() {
  const [menuOpen, setMenuOpen] = useState(false)
  const user = authSession.getUser()

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setMenuOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--surface)',
          cursor: 'pointer',
        }}
      >
        <span
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'var(--accent-bg)',
            border: '2px solid var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--accent)',
            flexShrink: 0,
          }}
        >
          {initialsOf(user?.fullName)}
        </span>
        <span style={{ textAlign: 'left', lineHeight: 1.2 }}>
          <span
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
            }}
          >
            {user?.fullName ?? 'Phi công'}
          </span>
          <span
            style={{ display: 'block', fontSize: 11, color: 'var(--text-3)' }}
          >
            {user?.email ?? ''}
          </span>
        </span>
        <span style={{ color: 'var(--text-3)', fontSize: 10 }}>▾</span>
      </button>

      {menuOpen && (
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: '110%',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
            boxShadow: 'var(--shadow-md)',
            padding: 8,
            minWidth: 160,
          }}
        >
          <LogoutButton />
        </div>
      )}
    </div>
  )
}
