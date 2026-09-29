import type { ReactNode } from 'react'

/** Row above a tab's table: optional badge on the left, create button right. */
export function Toolbar({
  badge,
  createLabel,
  onCreate,
}: {
  badge?: ReactNode
  createLabel: string
  onCreate: () => void
}) {
  return (
    <div className="adm-toolbar">
      <div>{badge}</div>
      <button type="button" className="odm-btn odm-btn-p" onClick={onCreate}>
        {createLabel}
      </button>
    </div>
  )
}
