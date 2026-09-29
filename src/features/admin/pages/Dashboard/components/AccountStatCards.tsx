import { useI18n } from '../../../../../shared/i18n'
import { StatCard } from '../../../components/common/StatCard'
import type { AccountStats } from '../accountStats'
import { adminDashboardPageMessages } from '../AdminDashboardPage.messages'

const SKELETON = <span className="adm-skeleton" aria-busy="true" />

/** KPI row: total / active / locked, values from the BE (`null` = loading). */
export function AccountStatCards({ stats }: { stats: AccountStats | null | undefined }) {
  const { t } = useI18n(adminDashboardPageMessages)
  return (
    <div className="adm-grid">
      <StatCard
        label={t.totalAccounts}
        value={stats ? stats.total : SKELETON}
        hint={t.systemWide}
      />
      <StatCard
        label={t.active}
        value={stats ? stats.active : SKELETON}
        hint={t.accountsUnit}
        tone="success"
      />
      <StatCard
        label={t.locked}
        value={stats ? stats.locked : SKELETON}
        hint={t.accountsUnit}
        tone={stats && stats.locked > 0 ? 'warning' : 'default'}
      />
    </div>
  )
}
