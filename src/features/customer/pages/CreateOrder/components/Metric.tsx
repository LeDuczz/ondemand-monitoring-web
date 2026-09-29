export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="co-metric">
      <div className="co-metric-label">{label}</div>
      <div className="co-metric-value">{value}</div>
    </div>
  )
}
