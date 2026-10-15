import { visibleItems, type DetailItem } from './requestDetailHelpers'
import { OrderIcon } from './OrderIcon'

export function FactList({ items }: { items: DetailItem[] }) {
  const visible = visibleItems(items)
  if (visible.length === 0) return null
  return (
    <dl className="odm-or-req-facts">
      {visible.map((item) => (
        <div
          key={item.label}
          className={
            item.icon
              ? `has-icon${item.tone ? ` tone-${item.tone}` : ''}`
              : undefined
          }
        >
          <dt>
            {item.icon ? (
              <span className="odm-or-req-ico" aria-hidden="true">
                <OrderIcon name={item.icon} size={20} />
              </span>
            ) : null}
            <span>{item.label}</span>
          </dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
