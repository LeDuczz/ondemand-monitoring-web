export function KpiCard({
  label,
  value,
  detail,
  href,
}: {
  label: string
  value: string
  detail: string
  href: string
}) {
  return (
    <a className="odm-card odm-mgr-kpi" href={href}>
      <span className="odm-mgr-kpi-label">{label}</span>
      <span className="odm-mgr-kpi-value">
        <span className="odm-tn odm-mgr-kpi-number">{value}</span>
        {detail ? <span className="odm-mgr-kpi-detail">{detail}</span> : null}
      </span>
    </a>
  )
}
