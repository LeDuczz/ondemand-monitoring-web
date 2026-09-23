import { useMemo, useState } from 'react'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { EmptyState, LoadingState } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { operatorApi } from '../api/operatorApi'
import { computeKpis } from '../lib/computeKpis'
import { demoNow } from '../lib/demoNow'
import { filterMissions, missionsByTab } from '../lib/filterMissions'
import { operatorHref } from '../routes'
import type { OperatorMission, OperatorMissionTab } from '../types/mission'
import { MissionListTable } from './MissionListTable'

const TAB_LABEL: Record<OperatorMissionTab, string> = {
  pending: 'Chờ phản hồi',
  upcoming: 'Sắp tới',
  history: 'Lịch sử',
}

const WEEKDAYS = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']

function headerDateLabel(now: Date): string {
  const weekday = WEEKDAYS[now.getDay()]
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${weekday}, ${dd}/${mm}/${now.getFullYear()} · ${hh}:${min}`
}

export function MissionListPage({ searchQuery }: { searchQuery: string }) {
  const [tab, setTab] = useState<OperatorMissionTab>('pending')
  const now = demoNow()

  const profileQuery = useApiQuery((signal) => operatorApi.getProfile(signal), [])
  const missionsQuery = useApiQuery((signal) => operatorApi.listMissions(undefined, signal), [])

  const allMissions = missionsQuery.data?.items ?? []
  const filtered = useMemo(
    () => filterMissions(allMissions, searchQuery),
    [allMissions, searchQuery],
  )
  const kpis = useMemo(
    () => (profileQuery.data ? computeKpis(allMissions, profileQuery.data, now) : null),
    [allMissions, profileQuery.data, now],
  )
  const tabItems = useMemo(() => missionsByTab(filtered, tab, now), [filtered, tab, now])
  const counts = useMemo(
    () => ({
      pending: missionsByTab(filtered, 'pending', now).length,
      upcoming: missionsByTab(filtered, 'upcoming', now).length,
      history: missionsByTab(filtered, 'history', now).length,
    }),
    [filtered, now],
  )

  if (missionsQuery.loading || profileQuery.loading) return <LoadingState />
  if (missionsQuery.error || profileQuery.error) {
    return (
      <EmptyState
        title="Không tải được danh sách mission"
        description="Mất kết nối hoặc máy chủ đang bận. Dữ liệu đã lưu vẫn an toàn."
        action={
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => {
              missionsQuery.reload()
              profileQuery.reload()
            }}
          >
            Thử lại
          </button>
        }
      />
    )
  }

  const profile = profileQuery.data
  if (!profile || !kpis) return null

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 16,
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, letterSpacing: '-.01em' }}>
            Mission của tôi
          </h1>
          <div style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 3 }}>
            {profile.fullName} · phi công hạng {profile.rank} · {headerDateLabel(now)}
          </div>
        </div>
        <a className="odm-btn" href={operatorHref({ screen: 'availability' })}>
          Khai báo lịch rảnh
        </a>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--yellow-bg)',
            color: 'var(--yellow-fg)',
            border: '1px solid var(--yellow-dot)',
          }}
        >
          <div style={{ flex: 1 }}>
            <strong>
              Chứng chỉ hết hạn {formatVn(profile.certExpiry)}, còn {kpis.certDaysLeft} ngày.
            </strong>{' '}
            <span>Gia hạn để không bị chặn phân công.</span>
          </div>
          <a className="odm-btn odm-btn-sm" href={operatorHref({ screen: 'profile' })}>
            Xem hồ sơ
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}>
        <KpiCard dotColor="var(--yellow-dot)" label="Chờ phản hồi" value={kpis.pendingCount}
          sub={kpis.pendingDeadlineLabel ? `trước ${kpis.pendingDeadlineLabel}` : undefined} />
        <KpiCard dotColor="var(--blue-dot)" label="Hôm nay" value={kpis.todayCount}
          sub={kpis.todayFlyingCount > 0 ? `${kpis.todayFlyingCount} đang bay` : undefined} />
        <KpiCard dotColor="var(--green-dot)" label="Sắp tới trong tuần" value={kpis.upcomingWeekCount} />
        <KpiCard dotColor="var(--orange-dot)" label="Chứng chỉ còn hiệu lực" value={`${kpis.certDaysLeft} ngày`}
          sub={`hết hạn ${kpis.certExpiryLabel}`} />
      </div>

      <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16, alignItems: 'start' }}>
        <div>
          <div
            role="tablist"
            style={{
              display: 'flex',
              gap: 2,
              background: 'var(--sf)',
              border: '1px solid var(--bd)',
              borderRadius: '8px 8px 0 0',
              padding: '0 8px',
            }}
          >
            {(Object.keys(TAB_LABEL) as OperatorMissionTab[]).map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                style={{
                  height: 38,
                  padding: '0 14px',
                  border: 0,
                  borderBottom: `2px solid ${tab === t ? 'var(--ink)' : 'transparent'}`,
                  marginBottom: -1,
                  background: 'transparent',
                  fontWeight: 600,
                  fontSize: 13,
                  color: tab === t ? 'var(--tx)' : 'var(--tx3)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {TAB_LABEL[t]}
                <span
                  className="odm-tn"
                  style={{ fontSize: 11, padding: '1px 6px', borderRadius: 9, background: 'var(--sf3)' }}
                >
                  {counts[t]}
                </span>
              </button>
            ))}
          </div>
          <MissionListTable missions={tabItems} now={now} />
        </div>
        <UpcomingRail missions={allMissions} now={now} />
      </div>
    </div>
  )
}

function UpcomingRail({ missions, now }: { missions: OperatorMission[]; now: Date }) {
  const today = now.toISOString().slice(0, 10)
  const next = missions
    .filter((m) => m.status === 'ACCEPTED')
    .map((m) => ({ m, start: new Date(`${m.date}T${m.startTime}:00+07:00`) }))
    .filter(({ start }) => start.getTime() > now.getTime())
    .sort((a, b) => a.start.getTime() - b.start.getTime())[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="odm-card">
        <div className="odm-card-body" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>Sắp tới giờ</div>
          {!next ? (
            <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>Không có mission sắp bay.</div>
          ) : (
            <NextFlightCard mission={next.m} start={next.start} now={now} today={today} />
          )}
        </div>
      </div>
    </div>
  )
}

function NextFlightCard({
  mission,
  start,
  now,
  today,
}: {
  mission: OperatorMission
  start: Date
  now: Date
  today: string
}) {
  const totalMinutes = Math.max(0, Math.round((start.getTime() - now.getTime()) / 60000))
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const dayLabel = mission.date === today ? 'Hôm nay' : start.toLocaleDateString('vi-VN')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <span className="odm-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
          {mission.id}
        </span>
        <StatusBadge tone="green">Đã nhận</StatusBadge>
      </div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 8 }}>
        còn {hours > 0 ? `${hours} giờ ${minutes} phút` : `${minutes} phút`}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{mission.title}</div>
      <div className="odm-tn" style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 4 }}>
        {mission.startTime}–{mission.endTime} · {dayLabel}
      </div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 4 }}>{mission.location}</div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>
        {mission.droneCode} {mission.droneName}
      </div>
      <a
        className="odm-btn odm-btn-ok"
        style={{ width: '100%', justifyContent: 'center' }}
        href={operatorHref({ screen: 'connect' })}
      >
        Bắt đầu chuyến bay
      </a>
    </div>
  )
}

function KpiCard({
  dotColor,
  label,
  value,
  sub,
}: {
  dotColor: string
  label: string
  value: number | string
  sub?: string
}) {
  return (
    <div className="odm-card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--tx3)', fontSize: 12, fontWeight: 600 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span className="odm-tn" style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-.02em' }}>
          {value}
        </span>
        {sub ? <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{sub}</span> : null}
      </div>
    </div>
  )
}

function formatVn(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}
