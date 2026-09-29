import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Rendered under the scrolling table, e.g. a result count or pager. */
  footer?: ReactNode
}

/** Rounded card whose table scrolls horizontally instead of the page. */
export function TableCard({ children, footer }: Props) {
  return (
    <div className="adm-table-card">
      <div className="adm-table-scroll">{children}</div>
      {footer ? <div className="adm-table-footer">{footer}</div> : null}
    </div>
  )
}
