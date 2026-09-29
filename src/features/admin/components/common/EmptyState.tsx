import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}

export function EmptyState({ title, description, action }: Props) {
  return (
    <div className="adm-empty">
      <div className="adm-empty-title">{title}</div>
      {description ? <div className="adm-empty-desc">{description}</div> : null}
      {action ? <div className="adm-empty-action">{action}</div> : null}
    </div>
  )
}
