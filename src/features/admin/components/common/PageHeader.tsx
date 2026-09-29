import type { ReactNode } from 'react'

type Props = {
  title: ReactNode
  subtitle?: ReactNode
  /** Right-aligned slot, usually the primary call to action. */
  actions?: ReactNode
  /** Optional link/breadcrumb rendered above the title. */
  back?: ReactNode
}

export function PageHeader({ title, subtitle, actions, back }: Props) {
  return (
    <header className="adm-page-header">
      {back ? <div className="adm-page-back">{back}</div> : null}
      <div className="adm-page-header-row">
        <div className="adm-page-header-text">
          <h1 className="adm-page-title">{title}</h1>
          {subtitle ? <p className="adm-page-subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="adm-page-actions">{actions}</div> : null}
      </div>
    </header>
  )
}
