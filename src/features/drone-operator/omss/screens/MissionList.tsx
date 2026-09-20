import { useState } from 'react'
import type { OperatorMission, OperatorProfile } from '../types'
import MissionCard from '../components/MissionCard'

interface Props {
  profile: OperatorProfile | null
  missions: OperatorMission[]
  loading?: boolean
  error?: string | null
  onView: (m: OperatorMission) => void
  onRetry?: () => void
}

type Tab = 'pending' | 'upcoming' | 'history'

function certWarning(dateStr: string): string | null {
  const diff = new Date(dateStr).getTime() - Date.now()
  const days = Math.floor(diff / 86400000)
  if (days > 30) return null
  if (days <= 0) return `Chứng chỉ đã hết hạn`
  return `Chứng chỉ hết hạn ${dateStr.split('T')[0]?.split('-').reverse().join('/')} · còn ${days} ngày`
}

function tabMissions(missions: OperatorMission[], tab: Tab): OperatorMission[] {
  if (tab === 'pending') return missions.filter((m) => m.state === 'WAITING_OPERATOR_ACCEPTANCE')
  if (tab === 'upcoming') return missions.filter(
    (m) => m.state === 'SCHEDULED' || m.state === 'IN_FLIGHT' || m.state === 'CONNECTED' ||
      m.state === 'PREFLIGHT_CHECKING' || m.state === 'READY_TO_FLY' || m.state === 'RETURNING' ||
      m.state === 'POSTFLIGHT_CHECKING',
  )
  return missions.filter((m) => m.state === 'COMPLETED' || m.state === 'CANCELLED')
}

export default function MissionList({ profile, missions, loading, error, onView, onRetry }: Props) {
  const [tab, setTab] = useState<Tab>('pending')

  const pending = missions.filter((m) => m.state === 'WAITING_OPERATOR_ACCEPTANCE')
  const upcoming = tabMissions(missions, 'upcoming')
  const history = tabMissions(missions, 'history')

  const counts: Record<Tab, number> = { pending: pending.length, upcoming: upcoming.length, history: history.length }
  const visible = tabMissions(missions, tab)

  const certMsg = profile ? certWarning(profile.certExpiryDate) : null

  const TABS: { id: Tab; label: string }[] = [
    { id: 'pending', label: 'Chờ phản hồi' },
    { id: 'upcoming', label: 'Sắp tới' },
    { id: 'history', label: 'Lịch sử' },
  ]

  return (
    <div className="fade-in" style={{ flex: 1, overflowY: 'auto', padding: '28px 32px' }}>
      {/* Breadcrumb */}
      <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 4 }}>
        <span style={{ fontWeight: 600, color: 'var(--text-2)' }}>Mission của tôi</span>
        {profile && (
          <span> · {profile.fullName} · phi công hạng {profile.licenseGrade}</span>
        )}
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', margin: '0 0 12px' }}>
        Mission của tôi
      </h1>

      {/* Cert warning */}
      {certMsg && (
        <div style={{
          background: 'var(--amber-bg)',
          border: '1px solid var(--amber-border)',
          borderRadius: 8,
          padding: '8px 14px',
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 13,
          color: 'var(--text)',
        }}>
          <span>⚠</span>
          <span>{certMsg}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 14px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.id ? '2px solid var(--blue)' : '2px solid transparent',
              color: tab === t.id ? 'var(--blue)' : 'var(--text-2)',
              fontWeight: tab === t.id ? 600 : 400,
              fontSize: 14,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: -1,
            }}
          >
            {t.label}
            {counts[t.id] > 0 && (
              <span style={{
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                background: tab === t.id ? 'var(--blue)' : 'var(--surface-2)',
                color: tab === t.id ? '#fff' : 'var(--text-2)',
                fontSize: 11,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
              }}>
                {counts[t.id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>Đang tải...</div>
      )}

      {!loading && error && (
        <div style={{ textAlign: 'center', padding: 48 }}>
          <div style={{ color: 'var(--red)', marginBottom: 12, fontSize: 14 }}>{error}</div>
          {onRetry && (
            <button className="op-btn op-btn-ghost" onClick={onRetry}>Thử lại</button>
          )}
        </div>
      )}

      {!loading && !error && visible.length === 0 && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-3)' }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>Chưa có mission nào</div>
          <div style={{ fontSize: 13 }}>
            {tab === 'pending' ? 'Không có mission nào đang chờ phản hồi' :
              tab === 'upcoming' ? 'Không có mission nào sắp tới' :
                'Lịch sử mission trống'}
          </div>
        </div>
      )}

      {!loading && !error && visible.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {visible.map((m) => (
            <MissionCard key={m.id} mission={m} onView={onView} />
          ))}
        </div>
      )}
    </div>
  )
}
