import type { ReactNode } from 'react'

type Props = {
  title?: ReactNode
  /** Optional slot on the right of the title row. */
  actions?: ReactNode
  children?: ReactNode
  className?: string
  /** Remove body padding, e.g. when the child is a full-bleed table. */
  flush?: boolean
}

export function Card({ title, actions, children, className, flush }: Props) {
  const hasHeader = Boolean(title || actions)
  return (
    <section className={`adm-card${className ? ` ${className}` : ''}`}>
      {hasHeader ? (
        <div className="adm-card-header">
          {title ? <h2 className="adm-card-title">{title}</h2> : <span />}
          {actions ? <div className="adm-card-actions">{actions}</div> : null}
        </div>
      ) : null}
      <div className={flush ? 'adm-card-body is-flush' : 'adm-card-body'}>
        {children}
      </div>
    </section>
  )
}
