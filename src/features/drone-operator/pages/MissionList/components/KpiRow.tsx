import { useI18n } from '../../../../../shared/i18n'
import type { OperatorKpis } from '../../../lib/computeKpis'
import type { OperatorProfile } from '../../../types/mission'
import { KpiCard } from './KpiCard'
import { kpiRowMessages } from './KpiRow.messages'

export function KpiRow({
  kpis,
  profile,
}: {
  kpis: OperatorKpis
  profile: OperatorProfile
}) {
  const { t } = useI18n(kpiRowMessages)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        gap: 14,
      }}
    >
      <KpiCard
        dotColor="var(--yellow-dot)"
        label={t.pending}
        value={kpis.pendingCount}
        sub={
          kpis.pendingDeadlineLabel
            ? t.pendingSub(kpis.pendingDeadlineLabel)
            : undefined
        }
      />
      <KpiCard
        dotColor="var(--blue-dot)"
        label={t.today}
        value={kpis.todayCount}
        sub={
          kpis.todayFlyingCount > 0
            ? t.todayFlyingSub(kpis.todayFlyingCount)
            : undefined
        }
      />
      <KpiCard
        dotColor="var(--green-dot)"
        label={t.upcomingWeek}
        value={kpis.upcomingWeekCount}
      />
      <KpiCard
        dotColor="var(--orange-dot)"
        label={t.certValid}
        value={
          profile.certExpiry ? t.certDays(kpis.certDaysLeft) : t.certNoData
        }
        sub={
          profile.certExpiry ? t.certExpirySub(kpis.certExpiryLabel) : undefined
        }
      />
    </div>
  )
}
