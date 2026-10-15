import type { ReactNode } from 'react'

import { FactList } from './FactList'
import { OrderIcon, type OrderIconName } from './OrderIcon'
import { visibleItems, type DetailItem } from './requestDetailHelpers'

/** A titled group of request facts; renders nothing when it has no data. */
export function FactSection({
  title,
  icon,
  items,
  children,
}: {
  title: string
  icon: OrderIconName
  items: DetailItem[]
  children?: ReactNode
}) {
  const visible = visibleItems(items)
  if (visible.length === 0 && !children) return null
  return (
    <section className="odm-or-req-section">
      <h4>
        <span aria-hidden="true">
          <OrderIcon name={icon} size={18} />
        </span>
        {title}
      </h4>
      <FactList items={visible} />
      {children}
    </section>
  )
}
