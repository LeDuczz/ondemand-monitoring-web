import { useState } from 'react'

import { StateView } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
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
import { formatVnDateTime } from '../lib/formatVnDateTime'
import { managerHref, type ManagerRoute } from '../routes'
import type { ActionItem } from '../types/dashboard'
import '../manager.css'

type ActionItemType = ActionItem['type']

const actionItemActionLabel: Record<ActionItemType, string> = {
  ORDER_PENDING: 'Duyệt',
  MISSION_UNASSIGNED: 'Phân công',
  MAINTENANCE_TICKET: 'Xem ticket',
  MEDIA_ACTION: 'Xử lý',
  MISSION_FLYING: 'Giám sát',
}

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

function actionItemAge(now: Date, item: ActionItem): string {
  switch (item.type) {
    case 'ORDER_PENDING':
      return formatOrderAge(now, item.submittedAtIso)
    case 'MISSION_UNASSIGNED':
      return formatMissionCountdown(now, item.scheduledStartIso)
    case 'MAINTENANCE_TICKET':
      return formatTicketAge(now, item.openedAtIso)
    case 'MEDIA_ACTION':
      return formatMinutesAgo(now, item.createdAtIso)
    case 'MISSION_FLYING':
      return formatFlightMinutes(now, item.startedAtIso)
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
const actionItemTypeLabel: Record<ActionItemType, string> = {
  ORDER_PENDING: 'Đơn chờ duyệt',
  MISSION_UNASSIGNED: 'Mission chưa phân công',
  MAINTENANCE_TICKET: 'Ticket bảo trì',
  MEDIA_ACTION: 'Media cần xử lý',
  MISSION_FLYING: 'Đang bay',
}

export function DashboardPage() {
  const [now] = useState(() => new Date())
  const [filter, setFilter] = useState<ActionItemType | 'all'>('all')
  const query = useApiQuery((signal) => managerApi.getDashboard(signal), [])

  if (query.loading) return <DashboardSkeleton />

  if (query.error) {
    return (
      <StateView
        state="error"
        title="Không tải được số liệu điều hành"
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
          <h1 className="odm-mgr-dash-title">Dashboard điều hành</h1>
          <div className="odm-mgr-dash-date">{formatVnDateTime(now)}</div>
        </div>
        <a className="odm-btn" href={managerHref({ screen: 'reports' })}>
          Báo cáo
        </a>
      </div>

      <div className="odm-mgr-kpi-row">
        <KpiCard
          label="Đơn chờ duyệt"
          value={String(data.kpis.pendingOrders.count)}
          detail={data.kpis.pendingOrders.detail}
          href={managerHref({ screen: 'orderQueue' })}
        />
        <KpiCard
          label="Mission hôm nay"
          value={String(data.kpis.missionsToday.count)}
          detail={data.kpis.missionsToday.detail}
          href={managerHref({ screen: 'missions' })}
        />
        <KpiCard
          label="Mission đang bay"
          value={String(data.kpis.missionsInFlight.count)}
          detail={data.kpis.missionsInFlight.detail}
          href={managerHref({ screen: 'live' })}
        />
        <KpiCard
          label="Drone sẵn sàng / tổng"
          value={`${data.kpis.dronesReady.ready}/${data.kpis.dronesReady.total}`}
          detail={data.kpis.dronesReady.detail}
          href={managerHref({ screen: 'drones' })}
        />
        <KpiCard
          label="Việc cần xử lý"
          value={String(data.kpis.actionItems.count)}
          detail={data.kpis.actionItems.detail}
          href={managerHref({ screen: 'media' })}
        />
      </div>

      <div className="odm-mgr-charts-row">
        <div className="odm-card">
          <div className="odm-card-header">
            Mission theo trạng thái · 7 ngày gần nhất
          </div>
          <div className="odm-card-body">
            <MissionStatusChart days={data.missionStatusByDay} />
          </div>
        </div>
        <div className="odm-card">
          <div className="odm-card-header">Trạng thái đội drone</div>
          <div className="odm-card-body">
            <DroneStatusDonut data={data.droneStatusBreakdown} />
          </div>
        </div>
      </div>

      <div className="odm-mgr-lower">
        <div className="odm-card">
          <div className="odm-card-header">
            <span>Cần xử lý ngay</span>
            {filter !== 'all' ? (
              <button
                type="button"
                className="odm-btn odm-btn-gh odm-btn-sm"
                onClick={() => setFilter('all')}
              >
                Xoá lọc
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
                  {actionItemTypeLabel[type]} (
                  {data.actionItems.filter((item) => item.type === type).length}
                  )
                </button>
              ))}
            </div>
          ) : null}
          {visibleItems.length === 0 ? (
            <div className="odm-mgr-empty-list">
              <div className="odm-mgr-empty-list-title">
                Không có việc cần xử lý
              </div>
              <div className="odm-mgr-empty-list-desc">
                Đơn chờ duyệt, mission chưa phân công và ticket nghiêm trọng sẽ
                hiện ở đây.
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
                    {actionItemAge(now, item)}
                  </div>
                  <a
                    className="odm-btn odm-btn-sm"
                    href={managerHref(actionItemRoute(item))}
                  >
                    {actionItemActionLabel[item.type]}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {data.flyingMission ? (
          <div className="odm-card odm-mgr-flying-card">
            <div className="odm-card-header">Đang bay</div>
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
                <div className="odm-mgr-flying-label">Drone / phi công</div>
                <div>
                  {data.flyingMission.droneCode} ·{' '}
                  {data.flyingMission.operatorName}
                </div>
              </div>
              <div className="odm-mgr-flying-field">
                <div className="odm-mgr-flying-label">Pin</div>
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
                <div className="odm-mgr-flying-label">Thời gian bay</div>
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
                Giám sát
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

function DashboardSkeleton() {
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
      <span className="odm-visually-hidden">Đang tải…</span>
    </div>
  )
}
