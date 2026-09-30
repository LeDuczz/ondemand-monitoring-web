/** Report summary response from `GET /api/reports/summary` [TK MNG-12]. */
export type WeekDataPoint = {
  week: string
  rate?: number
  avgHours?: number
}

export type ServiceCount = {
  service: string
  count: number
}

export type DroneUtilization = {
  droneCode: string
  droneName: string
  utilizationPct: number
}

export type FailureReason = {
  reason: string
  count: number
}

export type ReportSummary = {
  successRate: number
  successRateDelta: number
  totalMissionsFlown: number
  completedMissions: number
  failedMissions: number
  avgApprovalTimeHours: number
  avgApprovalTimeDeltaHours: number
  avgApprovalTimeDeltaWeekLabel: string
  avgFleetUtilizationPct: number
  weeklySuccessRate: { week: string; rate: number }[]
  weeklyApprovalTimeHours: { week: string; avgHours: number }[]
  serviceDistribution: ServiceCount[]
  totalOrders: number
  droneUtilization: DroneUtilization[]
  topFailureReasons: FailureReason[]
}
