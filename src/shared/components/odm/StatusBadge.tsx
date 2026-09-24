import type { ReactNode } from 'react'

import type { StatusTone } from '../../types/domain'

type StatusBadgeProps = {
  tone: StatusTone
  children: ReactNode
  size?: 'md' | 'lg'
}

export function StatusBadge({ tone, children, size = 'md' }: StatusBadgeProps) {
  const sizeClass = size === 'lg' ? ' odm-badge-lg' : ''
  return (
    <span className={`odm-badge odm-badge-${tone}${sizeClass}`}>
      <span className="odm-badge-dot" aria-hidden="true" />
      {children}
    </span>
  )
}
