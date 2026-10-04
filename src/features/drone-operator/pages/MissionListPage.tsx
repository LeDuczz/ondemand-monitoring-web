import { useMemo, useState } from 'react'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import {
  EmptyState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { operatorApi } from '../api/operatorApi'
import { setActiveMissionId } from '../api/liveMission'
import { computeKpis } from '../lib/computeKpis'
import { demoNow } from '../lib/demoNow'
import { formatDeviceLabel } from '../lib/deviceLabel'
import { filterMissions, missionsByTab } from '../lib/filterMissions'
import { operatorHref } from '../routes'
import type { OperatorMission, OperatorMissionTab } from '../types/mission'
import { MissionListTable } from './MissionListTable'
import { missionListPageMessages } from './MissionListPage.messages'

type Messages = (typeof missionListPageMessages)['vi']

function headerDateLabel(now: Date, t: Messages): string {
  const weekday = t.weekdays[now.getDay()]
  const dd = String(now.getDate()).padStart(2, '0')
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const hh = String(now.getHours()).padStart(2, '0')
  const min = String(now.getMinutes()).padStart(2, '0')
  return `${weekday}, ${dd}/${mm}/${now.getFullYear()} · ${hh}:${min}`
}

export function MissionListPage({ searchQuery }: { searchQuery: string }) {
  const [tab, setTab] = useState<OperatorMissionTab>('pending')
  const now = demoNow()
  const { t } = useI18n(missionListPageMessages)

  const profileQuery = useApiQuery(
    (signal) => operatorApi.getProfile(signal),
    [],
  )
  const missionsQuery = useApiQuery(
    (signal) => operatorApi.listMissions(undefined, signal),
    [],
  )

  const allMissions = missionsQuery.data?.items ?? []
  const filtered = useMemo(
    () => filterMissions(allMissions, searchQuery),
    [allMissions, searchQuery],
  )
  const kpis = useMemo(
    () =>
      profileQuery.data
        ? computeKpis(allMissions, profileQuery.data, now)
        : null,
    [allMissions, profileQuery.data, now],
  )
  const tabItems = useMemo(
    () => missionsByTab(filtered, tab, now),
    [filtered, tab, now],
  )
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
        title={t.loadFailedTitle}
        description={t.loadFailedDesc}
        action={
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => {
              missionsQuery.reload()
              profileQuery.reload()
            }}
          >
            {t.retry}
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
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 600,
              letterSpacing: '-.01em',
            }}
          >
            {t.title}
          </h1>
          <div style={{ color: 'var(--tx3)', fontSize: 12.5, marginTop: 3 }}>
            {profile.fullName}
            {profile.rank ? t.pilotRank(profile.rank) : ''} ·{' '}
            {headerDateLabel(now, t)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <a
            className="odm-btn"
            href={operatorHref({ screen: 'availability' })}
          >
            {t.declareAvailability}
          </a>
          <a className="odm-btn" href={operatorHref({ screen: 'maintenance' })}>
            {t.manageMaintenance}
          </a>
        </div>
      </div>

      {profile.certExpiry && (
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
                {t.certExpiring(
                  formatVn(profile.certExpiry),
                  kpis.certDaysLeft,
                )}
              </strong>{' '}
              <span>{t.certExpiringHint}</span>
            </div>
            <a
              className="odm-btn odm-btn-sm"
              href={operatorHref({ screen: 'profile' })}
            >
              {t.viewProfile}
            </a>
          </div>
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 14,
        }}
      >
        <KpiCard
          dotColor="var(--yellow-dot)"
          label={t.kpi.pending}
          value={kpis.pendingCount}
          sub={
            kpis.pendingDeadlineLabel
              ? t.kpi.pendingSub(kpis.pendingDeadlineLabel)
              : undefined
          }
        />
        <KpiCard
          dotColor="var(--blue-dot)"
          label={t.kpi.today}
          value={kpis.todayCount}
          sub={
            kpis.todayFlyingCount > 0
              ? t.kpi.todayFlyingSub(kpis.todayFlyingCount)
              : undefined
          }
        />
        <KpiCard
          dotColor="var(--green-dot)"
          label={t.kpi.upcomingWeek}
          value={kpis.upcomingWeekCount}
        />
        <KpiCard
          dotColor="var(--orange-dot)"
          label={t.kpi.certValid}
          value={
            profile.certExpiry
              ? t.kpi.certDays(kpis.certDaysLeft)
              : t.kpi.certNoData
          }
          sub={
            profile.certExpiry
              ? t.kpi.certExpirySub(kpis.certExpiryLabel)
              : undefined
          }
        />
      </div>

      <div
        style={{
          marginTop: 16,
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 16,
          alignItems: 'start',
        }}
      >
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
            {(Object.keys(t.tabLabel) as OperatorMissionTab[]).map((tabKey) => (
              <button
                key={tabKey}
                type="button"
                role="tab"
                aria-selected={tab === tabKey}
                onClick={() => setTab(tabKey)}
                style={{
                  height: 38,
                  padding: '0 14px',
                  border: 0,
                  borderBottom: `2px solid ${tab === tabKey ? 'var(--ink)' : 'transparent'}`,
                  marginBottom: -1,
                  background: 'transparent',
                  fontWeight: 600,
                  fontSize: 13,
                  color: tab === tabKey ? 'var(--tx)' : 'var(--tx3)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {t.tabLabel[tabKey]}
                <span
                  className="odm-tn"
                  style={{
                    fontSize: 11,
                    padding: '1px 6px',
                    borderRadius: 9,
                    background: 'var(--sf3)',
                  }}
                >
                  {counts[tabKey]}
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

function UpcomingRail({
  missions,
  now,
}: {
  missions: OperatorMission[]
  now: Date
}) {
  const { t } = useI18n(missionListPageMessages)
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
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>
            {t.upcomingSoon}
          </div>
          {!next ? (
            <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
              {t.noUpcomingMission}
            </div>
          ) : (
            <NextFlightCard
              mission={next.m}
              start={next.start}
              now={now}
              today={today}
            />
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
  const { t, locale } = useI18n(missionListPageMessages)
  const totalMinutes = Math.max(
    0,
    Math.round((start.getTime() - now.getTime()) / 60000),
  )
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const dayLabel =
    mission.date === today ? t.today2 : start.toLocaleDateString(locale)
  const deviceLabel = formatDeviceLabel(mission)
  const permissions = mission.permissions
  const reviewAction =
    permissions?.canInspectDevice ||
    permissions?.canUploadMedia ||
    permissions?.canMaintainDevice
      ? permissions.canMaintainDevice &&
        (mission.backendStatus === 'RETURNING' ||
          mission.backendStatus === 'POSTFLIGHT_CHECKING')
        ? {
            label: t.inspect,
            href: operatorHref({ screen: 'postflight', missionId: mission.id }),
          }
        : (mission.backendStatus === 'PENDING_REVIEW' || mission.backendStatus === 'COMPLETED') && permissions.canUploadMedia
          ? {
              label: t.reviewMedia,
              href: operatorHref({ screen: 'upload', missionId: mission.id }),
            }
          : {
              label: t.viewResult,
              href: operatorHref({
                screen: 'missionDetail',
                missionId: mission.id,
              }),
            }
      : null
  const flightAction =
    reviewAction ??
    (permissions?.canControlFlight &&
    (mission.backendStatus === 'READY_TO_FLY' ||
      mission.backendStatus === 'IN_FLIGHT' ||
      mission.backendStatus === 'IN_PROGRESS' ||
      mission.backendStatus === 'RETURNING')
      ? {
          label: t.startFlight,
          href: operatorHref({ screen: 'flight', missionId: mission.id }),
        }
      : {
          label: t.startFlight,
          href: operatorHref({ screen: 'connect', missionId: mission.id }),
        })

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span className="odm-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
          {mission.missionCode ?? mission.id}
        </span>
        <StatusBadge tone="green">{t.accepted}</StatusBadge>
      </div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 8 }}>
        {t.timeLeft(hours, minutes)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
        {mission.title}
      </div>
      <div
        className="odm-tn"
        style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 4 }}
      >
        {mission.startTime}–{mission.endTime} · {dayLabel}
      </div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 4 }}>
        {mission.location}
      </div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>
        {deviceLabel ?? t.unassignedDevice}
      </div>
      <a
        className="odm-btn odm-btn-ok"
        style={{ width: '100%', justifyContent: 'center' }}
        href={flightAction.href}
        onClick={() => setActiveMissionId(mission.id)}
      >
        {flightAction.label}
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
    <div
      className="odm-card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--tx3)',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
          }}
        />
        {label}
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span
          className="odm-tn"
          style={{ fontSize: 26, fontWeight: 600, letterSpacing: '-.02em' }}
        >
          {value}
        </span>
        {sub ? (
          <span style={{ fontSize: 12, color: 'var(--tx3)' }}>{sub}</span>
        ) : null}
      </div>
    </div>
  )
}

function formatVn(isoDate: string): string {
  const [y, m, d] = isoDate.split('-')
  return `${d}/${m}/${y}`
}
