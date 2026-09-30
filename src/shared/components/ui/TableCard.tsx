import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  /** Rendered under the scrolling table, e.g. a result count or pager. */
  footer?: ReactNode
}

/** Rounded card whose table scrolls horizontally instead of the page. */
export function TableCard({ children, footer }: Props) {
  return (
    <div className="ui-table-card">
      <div className="ui-table-scroll">{children}</div>
      {footer ? <div className="ui-table-footer">{footer}</div> : null}
    </div>
  )
}
