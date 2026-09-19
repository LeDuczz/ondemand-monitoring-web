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

export type ManagerDashboardResponse = {
  kpis: ManagerDashboardKpis
  missionStatusByDay: MissionStatusDayPoint[]
  droneStatusBreakdown: DroneStatusBreakdown[]
  actionItems: ActionItem[]
  flyingMission: FlyingMissionSummary | null
}
