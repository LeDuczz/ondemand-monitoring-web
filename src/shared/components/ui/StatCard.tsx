import type { ReactNode } from 'react'

export type StatTone = 'default' | 'success' | 'warning' | 'danger'

type Props = {
  label: ReactNode
  value: ReactNode
  hint?: ReactNode
  /** Colours the big number, e.g. warning when something needs attention. */
  tone?: StatTone
}

export function StatCard({ label, value, hint, tone = 'default' }: Props) {
  return (
    <div className="ui-stat">
      <div className="ui-stat-label">{label}</div>
      <div className={`ui-stat-value is-${tone}`}>{value}</div>
      {hint ? <div className="ui-stat-hint">{hint}</div> : null}
    </div>
  )
}
