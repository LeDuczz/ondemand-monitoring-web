export function KpiCard({
  label,
  value,
  detail,
  href,
}: {
  label: string
  value: string
  detail: string
  href?: string
}) {
  const body = (
    <>
      <span className="odm-mgr-kpi-label">{label}</span>
      <span className="odm-mgr-kpi-value">
        <span className="odm-tn odm-mgr-kpi-number">{value}</span>
        {detail ? <span className="odm-mgr-kpi-detail">{detail}</span> : null}
      </span>
    </>
  )
  return href ? (
    <a className="odm-card odm-mgr-kpi" href={href}>
      {body}
    </a>
  ) : (
    <div className="odm-card odm-mgr-kpi">{body}</div>
  )
}
