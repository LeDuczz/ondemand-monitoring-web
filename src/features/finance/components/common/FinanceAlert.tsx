import type { ReactNode } from 'react'

/** Inline error / success message used by every finance panel. */
export function FinanceAlert({
  tone,
  children,
}: {
  tone: 'error' | 'success'
  children: ReactNode
}) {
  return tone === 'error' ? (
    <p className="finance-alert is-error" role="alert">
      {children}
    </p>
  ) : (
    <p className="finance-alert is-success" role="status" aria-live="polite">
      {children}
    </p>
  )
}
