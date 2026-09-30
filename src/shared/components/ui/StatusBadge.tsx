import type { ReactNode } from 'react'

import type { StatusTone } from '../../types/domain'

export type UiTone = 'success' | 'warning' | 'danger' | 'neutral' | 'info'

const FROM_STATUS_TONE: Record<StatusTone, UiTone> = {
  green: 'success',
  yellow: 'warning',
  orange: 'warning',
  red: 'danger',
  blue: 'info',
  gray: 'neutral',
}

/** Maps the shared `StatusTone` colours onto the UI badge tones. */
export function toUiTone(tone: StatusTone): UiTone {
  return FROM_STATUS_TONE[tone]
}

type Props = {
  tone?: UiTone
  children: ReactNode
}

export function StatusBadge({ tone = 'neutral', children }: Props) {
  return (
    <span className={`ui-badge is-${tone}`}>
      <span className="ui-badge-dot" aria-hidden="true" />
      {children}
    </span>
  )
}
