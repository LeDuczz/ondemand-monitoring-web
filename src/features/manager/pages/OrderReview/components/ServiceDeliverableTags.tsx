export function ServiceDeliverableTags({ labels }: { labels: string[] }) {
  if (labels.length === 0) return null
  return (
    <ul className="odm-osb-tags">
      {labels.map((label) => (
        <li key={label} className="odm-osb-tag">
          {label}
        </li>
      ))}
    </ul>
  )
}
