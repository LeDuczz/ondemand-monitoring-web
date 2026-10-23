import { Card, Skeleton } from '../../../../../shared/components/ui'
import type { PageMessages } from '../dashboardTypes'
import '../dashboard.css'

function ListSkeleton({ rows }: { rows: number }) {
  return (
    <div className="odm-dash-sk-list">
      {Array.from({ length: rows }, (_, i) => <Skeleton key={i} variant="block" height={40} />)}
    </div>
  )
}

export function DashboardSkeleton({ t }: { t: PageMessages }) {
  return (
    <div className="odm-dash" aria-busy="true" aria-live="polite">
      <Skeleton variant="line" width="30%" height={28} />
      <div className="odm-dash-kpis">
        {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} variant="block" height={104} />)}
      </div>
      <div className="odm-dash-grid">
        <div className="odm-dash-col">
          <Card><ListSkeleton rows={4} /></Card>
          <Card><ListSkeleton rows={4} /></Card>
        </div>
        <div className="odm-dash-col">
          <Card><ListSkeleton rows={3} /></Card>
          <Card><ListSkeleton rows={3} /></Card>
          <Card><ListSkeleton rows={3} /></Card>
        </div>
      </div>
      <Card><Skeleton variant="block" height={180} /></Card>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
