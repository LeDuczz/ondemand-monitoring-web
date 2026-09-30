// GET /api/manager/dashboard response shape [TK MNG-01]. Field names are
// camelCase per [00-PLAN.md §6]; `DroneStatus` is the backend enum (see
// mapping table in evd/P3-manager-dashboard.md — the design's donut uses
// brief-only values AVAILABLE/ASSIGNED/IN_FLIGHT/MAINTENANCE/RETIRED that
// don't all exist on the backend enum, so the mock data maps them onto
// AVAILABLE/RESERVED/IN_MISSION/MAINTENANCE/OUT_OF_SERVICE).
import type { DroneStatus } from '../../../shared/types/domain'

export type ManagerDashboardKpis = {
  pendingOrders: { count: number; detail: string }
  missionsToday: { count: number; detail: string }
  missionsInFlight: { count: number; detail: string }
  dronesReady: { ready: number; total: number; detail: string }
  actionItems: { count: number; detail: string }
}

/** One day of the "Mission theo trạng thái · 7 ngày gần nhất" stacked bar chart. */
export type MissionStatusDayPoint = {
  /** ISO date, yyyy-mm-dd. */
  date: string
  completed: number
  inFlight: number
  failed: number
  cancelled: number
}

export type DroneStatusBreakdown = {
  status: DroneStatus
  count: number
}

export type ActionItem =
  | {
      id: string
      type: 'ORDER_PENDING'
      orderId: string
      code: string
      title: string
      subtitle: string
      submittedAtIso: string
    }
  | {
      id: string
      type: 'MISSION_UNASSIGNED'
      missionId: string
      code: string
      title: string
      subtitle: string
      scheduledStartIso: string
    }
  | {
      id: string
      type: 'MAINTENANCE_TICKET'
      ticketId: string
      code: string
      title: string
      subtitle: string
      openedAtIso: string
    }
  | {
      id: string
      type: 'MEDIA_ACTION'
      mediaTaskId: string
      code: string
      title: string
      subtitle: string
      createdAtIso: string
    }
  | {
      id: string
      type: 'MISSION_FLYING'
      missionId: string
      code: string
      title: string
      subtitle: string
      startedAtIso: string
    }

export type FlyingMissionSummary = {
  missionId: string
  code: string
  title: string
  droneCode: string
  droneName: string
  operatorName: string
  batteryPercent: number
  startedAtIso: string
  plannedDurationMin: number
}

// PROPOSED: not part of [TK MNG-01]'s own JSON-shaped payload — the design's
// sidebar badge numbers (Duyệt đơn 6 / Bảo trì 3 / Media 6) are static demo
// values baked into the MNG-*.dc.html markup, not computed from the
// dashboard's own `actionItems` (which only lists the handful of items that
// need attention *right now*, not the full open count). Added here so the
// sidebar can show real totals instead of undercounting. Values sourced from
// design strings, not invented:
//   - pendingOrders: mirrors `kpis.pendingOrders.count` (6)
//   - openMaintenanceTickets: [TK MNG-10] page subtitle "3 ticket đang mở" -> 3
//   - mediaNeedsAction: [TK MNG-11] page subtitle "2 tệp cần upload thủ công ·
//     2 tệp lỗi xác thực · 2 mission chờ giao" -> 2 + 2 + 2 = 6
// Needs backend confirmation before this becomes a real contract field.
export type ManagerDashboardNavCounts = {
  pendingOrders: number
  openMaintenanceTickets: number
  mediaNeedsAction: number
}

export type ManagerDashboardResponse = {
  kpis: ManagerDashboardKpis
  missionStatusByDay: MissionStatusDayPoint[]
  droneStatusBreakdown: DroneStatusBreakdown[]
  actionItems: ActionItem[]
  flyingMission: FlyingMissionSummary | null
  /** PROPOSED — see `ManagerDashboardNavCounts`. */
  navCounts: ManagerDashboardNavCounts
}
