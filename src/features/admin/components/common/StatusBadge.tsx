import type { ReactNode } from 'react'

import type { StatusTone } from '../../../../shared/types/domain'

export type AdminTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const FROM_STATUS_TONE: Record<StatusTone, AdminTone> = {
  green: 'success',
  yellow: 'warning',
  orange: 'warning',
  red: 'danger',
  blue: 'info',
  gray: 'neutral',
}

/** Maps the shared `StatusTone` colours onto the admin badge tones. */
export function toAdminTone(tone: StatusTone): AdminTone {
  return FROM_STATUS_TONE[tone]
}

type Props = {
  tone?: AdminTone
  children: ReactNode
}

export function StatusBadge({ tone = 'neutral', children }: Props) {
  return (
    <span className={`adm-badge is-${tone}`}>
      <span className="adm-badge-dot" aria-hidden="true" />
      {children}
    </span>
  )
}
