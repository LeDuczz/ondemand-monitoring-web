import type { ReactNode } from 'react'

export type OpBadgeTone = 'gray' | 'blue' | 'green' | 'amber' | 'orange' | 'red'

const MAP: Record<OpBadgeTone, { bg: string; fg: string; bd: string }> = {
  gray: { bg: 'var(--surface-2)', fg: 'var(--text-2)', bd: 'var(--border)' },
  blue: { bg: 'var(--blue-bg)', fg: 'var(--blue-text)', bd: 'var(--blue-border)' },
  green: { bg: 'var(--green-bg)', fg: 'var(--green-text)', bd: 'var(--green-border)' },
  amber: { bg: 'var(--amber-bg)', fg: 'var(--amber-text)', bd: 'var(--amber-border)' },
  orange: { bg: 'var(--amber-bg)', fg: 'var(--amber-text)', bd: 'var(--amber-border)' },
  red: { bg: 'var(--red-bg)', fg: 'var(--red-text)', bd: 'var(--red-border)' },
}

type OpBadgeProps = {
  tone: OpBadgeTone
  children: ReactNode
  size?: 'md' | 'lg'
}

export function OpBadge({ tone, children, size = 'md' }: OpBadgeProps) {
  const c = MAP[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: size === 'lg' ? '4px 12px' : '2px 10px',
        borderRadius: 999,
        fontSize: size === 'lg' ? 13 : 12,
        fontWeight: 600,
        background: c.bg,
        color: c.fg,
        border: `1px solid ${c.bd}`,
      }}
    >
      {children}
    </span>
  )
}
