import type { Screen } from '../types'
import { NavGroupView, buildOperatorNavGroups } from './OperatorNavGroups'
import OperatorUserMenu from './OperatorUserMenu'

export { BREADCRUMB_LABELS } from './OperatorNavGroups'

interface Props {
  screen: Screen
  onNavigate: (screen: Screen) => void
  pendingCount: number
  notificationCount: number
}

export default function OperatorTopNav({
  screen,
  onNavigate,
  pendingCount,
  notificationCount,
}: Props) {
  const groups = buildOperatorNavGroups(pendingCount, notificationCount)

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        display: 'flex',
        alignItems: 'center',
        gap: 20,
        padding: '10px 20px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap',
        rowGap: 8,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M9 2L16 7v9H2V7L9 2z"
              stroke="#fff"
              strokeWidth="1.5"
              fill="none"
              strokeLinejoin="round"
            />
            <circle cx="9" cy="10" r="2" fill="#fff" opacity=".85" />
          </svg>
        </div>
        <div>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: 'var(--text)',
              lineHeight: 1.2,
            }}
          >
            OnDemand Monitor
          </div>
          <div
            style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.2 }}
          >
            Phi công · web
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 20,
          flex: 1,
          flexWrap: 'wrap',
        }}
      >
        {groups.map((group) => (
          <NavGroupView
            key={group.label}
            group={group}
            activeScreen={screen}
            onNavigate={onNavigate}
          />
        ))}
      </div>

      <OperatorUserMenu />
    </header>
  )
}
