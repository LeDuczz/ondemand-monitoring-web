import { visibleItems, type DetailItem } from './requestDetailHelpers'

export function FactList({ items }: { items: DetailItem[] }) {
  const visible = visibleItems(items)
  if (visible.length === 0) return null
  return (
    <dl className="odm-or-kv">
      {visible.map((item, idx) => (
        <div
          key={typeof item.label === 'string' ? item.label : `detail-${idx}`}
        >
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  )
}
