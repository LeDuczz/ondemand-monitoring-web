import { StatCard } from '../../../../../shared/components/ui'

export function MissionKpis({
  kpis,
}: {
  kpis: { label: string; value: string }[]
}) {
  return (
    <div className="mgr-kpis">
      {kpis.map((item) => (
        <StatCard key={item.label} label={item.label} value={item.value} />
      ))}
    </div>
  )
}
