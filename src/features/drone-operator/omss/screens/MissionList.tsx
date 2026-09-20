import { useState } from 'react'
import type { OperatorMission, OperatorProfile } from '../types'
import MissionTable from '../components/MissionTable'
import OperatorKpiCards from '../components/OperatorKpiCards'
import MissionListHeader from '../components/MissionListHeader'
import MissionListTabs, {
  type MissionListTab,
} from '../components/MissionListTabs'
import { computeOperatorKpis } from '../missionStats'

interface Props {
  profile: OperatorProfile | null
  missions: OperatorMission[]
  loading?: boolean
  error?: string | null
  onView: (m: OperatorMission) => void
  onGoAvailability?: () => void
  onRetry?: () => void
}

function tabMissions(
  missions: OperatorMission[],
  tab: MissionListTab,
): OperatorMission[] {
  if (tab === 'pending')
    return missions.filter((m) => m.state === 'WAITING_OPERATOR_ACCEPTANCE')
  if (tab === 'upcoming')
    return missions.filter(
      (m) =>
        m.state === 'SCHEDULED' ||
        m.state === 'IN_FLIGHT' ||
        m.state === 'CONNECTED' ||
        m.state === 'PREFLIGHT_CHECKING' ||
        m.state === 'READY_TO_FLY' ||
        m.state === 'RETURNING' ||
        m.state === 'POSTFLIGHT_CHECKING',
    )
  return missions.filter(
    (m) => m.state === 'COMPLETED' || m.state === 'CANCELLED',
  )
}

export default function MissionList({
  profile,
  missions,
  loading,
  error,
  onView,
  onGoAvailability,
  onRetry,
}: Props) {
  const [tab, setTab] = useState<MissionListTab>('pending')

  const counts: Record<MissionListTab, number> = {
    pending: tabMissions(missions, 'pending').length,
    upcoming: tabMissions(missions, 'upcoming').length,
    history: tabMissions(missions, 'history').length,
  }
  const visible = tabMissions(missions, tab)
  const kpis = computeOperatorKpis(missions, profile)

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}
    >
      <MissionListHeader
        profile={profile}
        onGoAvailability={onGoAvailability}
      />

      <div style={{ marginTop: 16 }}>
        <OperatorKpiCards kpis={kpis} />
      </div>

      <MissionListTabs tab={tab} counts={counts} onChange={setTab} />

      {loading && (
        <div
          style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}
        >
          Đang tải...
        </div>
      )}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ color: 'var(--red)', marginBottom: 12, fontSize: 14 }}>
            {error}
          </div>
          {onRetry && (
            <button className="op-btn op-btn-ghost" onClick={onRetry}>
              Thử lại
            </button>
          )}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div
          style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}
        >
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-2)',
              marginBottom: 4,
            }}
          >
            Chưa có mission nào
          </div>
          <div style={{ fontSize: 13 }}>
            {tab === 'pending'
              ? 'Không có mission nào đang chờ phản hồi'
              : tab === 'upcoming'
                ? 'Không có mission nào sắp tới'
                : 'Lịch sử mission trống'}
          </div>
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <MissionTable missions={visible} onView={onView} />
      )}
    </div>
  )
}
