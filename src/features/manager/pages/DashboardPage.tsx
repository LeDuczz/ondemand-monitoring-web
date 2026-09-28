import { useState } from 'react'

import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { useI18n } from '../../../shared/i18n'
import { managerApi } from '../api/dashboardApi'
import { DroneStatusDonut } from '../components/DroneStatusDonut'
import { MissionStatusChart } from '../components/MissionStatusChart'
import {
  formatFlightMinutes,
  formatFlightProgress,
  formatMinutesAgo,
  formatMissionCountdown,
  formatOrderAge,
  formatTicketAge,
} from '../lib/actionItemAge'
import { formatDateTime } from '../lib/formatVnDateTime'
import { dashboardPageMessages } from './DashboardPage.messages'
import { managerHref, type ManagerRoute } from '../routes'
import type { ActionItem } from '../types/dashboard'
import type { Language } from '../../../shared/i18n'
import '../manager.css'

type ActionItemType = ActionItem['type']
type PageMessages = (typeof dashboardPageMessages)['vi']

function actionItemRoute(item: ActionItem): ManagerRoute {
  switch (item.type) {
    case 'ORDER_PENDING':
      return { screen: 'orderReview', orderId: item.orderId }
    case 'MISSION_UNASSIGNED':
      return { screen: 'missionDispatch', missionId: item.missionId }
    case 'MAINTENANCE_TICKET':
      return { screen: 'maintenance' }
    case 'MEDIA_ACTION':
      return { screen: 'media' }
    case 'MISSION_FLYING':
      return { screen: 'live', missionId: item.missionId }
  }
}

function actionItemAge(now: Date, item: ActionItem, lang: Language): string {
  switch (item.type) {
    case 'ORDER_PENDING':
      return formatOrderAge(now, item.submittedAtIso, 24, lang)
    case 'MISSION_UNASSIGNED':
      return formatMissionCountdown(now, item.scheduledStartIso, lang)
    case 'MAINTENANCE_TICKET':
      return formatTicketAge(now, item.openedAtIso, lang)
    case 'MEDIA_ACTION':
      return formatMinutesAgo(now, item.createdAtIso, lang)
    case 'MISSION_FLYING':
      return formatFlightMinutes(now, item.startedAtIso, lang)
  }
}

// Label for each action-item-type filter chip above "Cần xử lý ngay".
// [TK MNG-01]'s own prototype ties the KPI cards themselves to this filter
// (onClick sets local demo state), but here the KPI cards instead navigate
// to their related queue screen (Đơn chờ duyệt -> orders queue, Mission hôm
// nay -> missions, Mission đang bay -> live, Drone sẵn sàng -> drones, Việc
// cần xử lý -> media) — a real shortcut instead of a prototype-only local
// toggle. The list keeps its own small filter-chip row instead, matching
// the design's "filter chip + Xoá lọc" affordance without depending on KPI
// clicks (documented in evd/P3-manager-dashboard.md).

export function DashboardPage() {
  const { t, lang } = useI18n(dashboardPageMessages)
  const [now] = useState(() => new Date())
  const [filter, setFilter] = useState<ActionItemType | 'all'>('all')
  const query = useApiQuery((signal) => managerApi.getDashboard(signal), [])

  if (query.loading) return <DashboardSkeleton t={t} />

  if (query.error) {
    return (
      <StateView
        state="error"
        title={t.loadError}
        error={query.error}
        onRetry={query.reload}
      />
    )
  }

  const data = query.data
  if (!data) return null

  const visibleItems =
    filter === 'all'
      ? data.actionItems
      : data.actionItems.filter((item) => item.type === filter)

  const presentTypes = Array.from(
    new Set(data.actionItems.map((item) => item.type)),
  )

  return (
    <div className="odm-mgr-dash">
      <div className="odm-mgr-dash-head">
        <div>
          <h1 className="odm-mgr-dash-title">{t.title}</h1>
          <div className="odm-mgr-dash-date">{formatDateTime(now, lang)}</div>
        </div>
        <a className="odm-btn" href={managerHref({ screen: 'reports' })}>
          {t.reports}
        </a>
      </div>

      <div className="odm-mgr-kpi-row">
        <KpiCard
          label={t.kpis.pendingOrders}
          value={String(data.kpis.pendingOrders.count)}
          detail={data.kpis.pendingOrders.detail}
          href={managerHref({ screen: 'orderQueue' })}
        />
        <KpiCard
          label={t.kpis.missionsToday}
          value={String(data.kpis.missionsToday.count)}
          detail={data.kpis.missionsToday.detail}
          href={managerHref({ screen: 'missions' })}
        />
        <KpiCard
          label={t.kpis.missionsInFlight}
          value={String(data.kpis.missionsInFlight.count)}
          detail={data.kpis.missionsInFlight.detail}
          href={managerHref({ screen: 'live' })}
        />
        <KpiCard
          label={t.kpis.dronesReady}
          value={`${data.kpis.dronesReady.ready}/${data.kpis.dronesReady.total}`}
          detail={data.kpis.dronesReady.detail}
          href={managerHref({ screen: 'drones' })}
        />
        <KpiCard
          label={t.kpis.actionItems}
          value={String(data.kpis.actionItems.count)}
          detail={data.kpis.actionItems.detail}
          href={managerHref({ screen: 'media' })}
        />
      </div>

      <div className="odm-mgr-charts-row">
        <div className="odm-card">
          <div className="odm-card-header">{t.missionsByStatus}</div>
          <div className="odm-card-body">
            <MissionStatusChart days={data.missionStatusByDay} />
          </div>
        </div>
        <div className="odm-card">
          <div className="odm-card-header">{t.droneFleetStatus}</div>
          <div className="odm-card-body">
            <DroneStatusDonut data={data.droneStatusBreakdown} />
          </div>
        </div>
      </div>

      <div className="odm-mgr-lower">
        <div className="odm-card">
          <div className="odm-card-header">
            <span>{t.actionListTitle}</span>
            {filter !== 'all' ? (
              <button
                type="button"
                className="odm-btn odm-btn-gh odm-btn-sm"
                onClick={() => setFilter('all')}
              >
                {t.clearFilter}
              </button>
            ) : null}
          </div>
          {presentTypes.length > 1 ? (
            <div className="odm-mgr-filter-chips">
              {presentTypes.map((type) => (
                <button
                  key={type}
                  type="button"
                  className={`odm-mgr-chip ${filter === type ? 'is-active' : ''}`}
                  aria-pressed={filter === type}
                  onClick={() =>
                    setFilter((current) => (current === type ? 'all' : type))
                  }
                >
                  {t.actionTypeFilter[type]} (
                  {data.actionItems.filter((item) => item.type === type).length}
                  )
                </button>
              ))}
            </div>
          ) : null}
          {visibleItems.length === 0 ? (
            <div className="odm-mgr-empty-list">
              <div className="odm-mgr-empty-list-title">{t.emptyListTitle}</div>
              <div className="odm-mgr-empty-list-desc">
                {t.emptyListDescription}
              </div>
            </div>
          ) : (
            <ul className="odm-mgr-action-list">
              {visibleItems.map((item) => (
                <li key={item.id} className="odm-mgr-action-row">
                  <div className="odm-mgr-action-text">
                    <div className="odm-mgr-action-title">{item.title}</div>
                    <div className="odm-mgr-action-subtitle">
                      {item.subtitle}
                    </div>
                  </div>
                  <div className="odm-mgr-action-age odm-tn">
                    {actionItemAge(now, item, lang)}
                  </div>
                  <a
                    className="odm-btn odm-btn-sm"
                    href={managerHref(actionItemRoute(item))}
                  >
                    {t.actionType[item.type]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {data.flyingMission ? (
          <div className="odm-card odm-mgr-flying-card">
            <div className="odm-card-header">{t.flying.title}</div>
            <div className="odm-card-body odm-mgr-flying-body">
              <div>
                <div className="odm-mgr-flying-code odm-mono">
                  {data.flyingMission.code}
                </div>
                <div className="odm-mgr-flying-title">
                  {data.flyingMission.title}
                </div>
              </div>
              <div className="odm-mgr-flying-field">
                <div className="odm-mgr-flying-label">
                  {t.flying.droneOperator}
                </div>
                <div>
                  {data.flyingMission.droneCode} ·{' '}
                  {data.flyingMission.operatorName}
                </div>
              </div>
              <div className="odm-mgr-flying-field">
                <div className="odm-mgr-flying-label">{t.flying.battery}</div>
                <div className="odm-mgr-battery">
                  <span className="odm-mgr-battery-track">
                    <span
                      className="odm-mgr-battery-fill"
                      style={{ width: `${data.flyingMission.batteryPercent}%` }}
                    />
                  </span>
                  <span className="odm-tn">
                    {data.flyingMission.batteryPercent}%
                  </span>
                </div>
              </div>
              <div className="odm-mgr-flying-field">
                <div className="odm-mgr-flying-label">
                  {t.flying.flightTime}
                </div>
                <div className="odm-tn">
                  {formatFlightProgress(
                    now,
                    data.flyingMission.startedAtIso,
                    data.flyingMission.plannedDurationMin,
                  )}
                </div>
              </div>
              <a
                className="odm-btn odm-btn-p"
                href={managerHref({
                  screen: 'live',
                  missionId: data.flyingMission.missionId,
                })}
              >
                {t.flying.monitor}
              </a>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function KpiCard({
  label,
  value,
  detail,
  href,
}: {
  label: string
  value: string
  detail: string
  href: string
}) {
  return (
    <a className="odm-card odm-mgr-kpi" href={href}>
      <span className="odm-mgr-kpi-label">{label}</span>
      <span className="odm-mgr-kpi-value">
        <span className="odm-tn odm-mgr-kpi-number">{value}</span>
        {detail ? <span className="odm-mgr-kpi-detail">{detail}</span> : null}
      </span>
    </a>
  )
}

function DashboardSkeleton({ t }: { t: PageMessages }) {
  return (
    <div className="odm-mgr-dash" aria-busy="true" aria-live="polite">
      <div className="odm-mgr-kpi-row">
        {Array.from({ length: 5 }, (_, i) => (
          <div className="odm-card odm-mgr-kpi-sk" key={i}>
            <span className="odm-sk" style={{ width: '60%', height: 12 }} />
            <span className="odm-sk" style={{ width: '40%', height: 24 }} />
          </div>
        ))}
      </div>
      <div className="odm-mgr-charts-row">
        <div className="odm-card odm-mgr-chart-sk">
          <span className="odm-sk" style={{ width: '100%', height: 200 }} />
        </div>
        <div className="odm-card odm-mgr-chart-sk">
          <span className="odm-sk" style={{ width: '100%', height: 200 }} />
        </div>
      </div>
      <div className="odm-card odm-mgr-chart-sk">
        <span className="odm-sk" style={{ width: '100%', height: 160 }} />
      </div>
      <span className="odm-visually-hidden">{t.loading}</span>
    </div>
  )
}
