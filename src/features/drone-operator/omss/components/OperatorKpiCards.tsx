import type { OperatorKpis } from '../missionStats'

interface Props {
  kpis: OperatorKpis
}

function KpiCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div
      style={{
        flex: '1 1 180px',
        minWidth: 160,
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
          color: 'var(--text)',
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>
          {sub}
        </div>
      )}
    </div>
  )
}

export default function OperatorKpiCards({ kpis }: Props) {
  return (
    <div
      style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}
    >
      <KpiCard
        label="Chờ phản hồi"
        value={String(kpis.pendingCount)}
        sub={
          kpis.pendingDeadlineLabel
            ? `trước ${kpis.pendingDeadlineLabel}`
            : undefined
        }
      />
      <KpiCard
        label="Hôm nay"
        value={String(kpis.todayCount)}
        sub={
          kpis.todayInFlightCount > 0
            ? `${kpis.todayInFlightCount} đang bay`
            : undefined
        }
      />
      <KpiCard
        label="Sắp tới trong tuần"
        value={String(kpis.upcomingWeekCount)}
      />
      <KpiCard
        label="Chứng chỉ còn hiệu lực"
        value={
          kpis.certDaysRemaining !== null
            ? `${kpis.certDaysRemaining} ngày`
            : '—'
        }
        sub={
          kpis.certExpiryLabel ? `hết hạn ${kpis.certExpiryLabel}` : undefined
        }
      />
    </div>
  )
}
