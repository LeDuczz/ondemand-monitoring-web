import type { Drone, Mission } from '../omss/types'
import type { OperatorMission, OperatorMissionStatus } from '../types/mission'

export type BackendMission = {
  id: string
  missionCode?: string | null
  orderId?: string | null
  orderTitle?: string | null
  customerName?: string | null
  status: string
  operatorId?: string | null
  droneId?: string | null
  droneCode?: string | null
  latitude?: number | null
  longitude?: number | null
  address?: string | null
  scheduledStartAt?: string | null
  startedAt?: string | null
  completedAt?: string | null
  description?: string | null
  rejectionReason?: string | null
  mediaType?: string | null
  plan?: {
    id?: string | null
    planningAlgorithm?: string
    feasibilityStatus?: string | null
    plannedDistanceM?: number | null
    plannedDurationSec?: number | null
    maxPlannedAltitudeM?: number | null
    estimatedEnergyMah?: number | null
    estimatedBatteryUsedPercent?: number | null
    availableBatteryPercentAtPlanning?: number | null
    estimatedRemainingBatteryPercent?: number | null
    waypoints?: Array<{
      id?: string
      sequence?: number
      simX?: number
      simY?: number
      altitudeM?: number
      plannedSpeedMps?: number
      reason?: string
    }>
  } | null
}

const ACTIVE_MISSION_KEY = 'fieldwise.operator.activeMissionId'
const ACTIVE_FLOW_STEP_KEY = 'fieldwise.operator.activeMissionFlowStep'

export function setActiveMissionId(id: string) {
  const current = window.sessionStorage.getItem(ACTIVE_MISSION_KEY)
  window.sessionStorage.setItem(ACTIVE_MISSION_KEY, id)
  window.localStorage.setItem(ACTIVE_MISSION_KEY, id)
  if (current !== id) window.sessionStorage.setItem(ACTIVE_FLOW_STEP_KEY, '0')
}

export function clearActiveMissionId(id?: string) {
  const current = getActiveMissionId()
  if (!id || current === id) {
    window.sessionStorage.removeItem(ACTIVE_MISSION_KEY)
    window.sessionStorage.removeItem(ACTIVE_FLOW_STEP_KEY)
    window.localStorage.removeItem(ACTIVE_MISSION_KEY)
  }
}

export function getActiveMissionId(): string | null {
  const sessionId = window.sessionStorage.getItem(ACTIVE_MISSION_KEY)
  if (sessionId) return sessionId
  const storedId = window.localStorage.getItem(ACTIVE_MISSION_KEY)
  if (storedId) window.sessionStorage.setItem(ACTIVE_MISSION_KEY, storedId)
  return storedId
}

export function getActiveMissionFlowStep(): number {
  const value = Number(window.sessionStorage.getItem(ACTIVE_FLOW_STEP_KEY))
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

export function markActiveMissionFlowStep(missionId: string, step: number) {
  if (window.sessionStorage.getItem(ACTIVE_MISSION_KEY) !== missionId) return
  const current = getActiveMissionFlowStep()
  window.sessionStorage.setItem(ACTIVE_FLOW_STEP_KEY, String(Math.max(current, step)))
}

function localDateAndTime(iso?: string | null) {
  if (!iso) return { date: '', time: '' }
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return { date: '', time: '' }
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(value)
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? ''
  return {
    date: `${part('year')}-${part('month')}-${part('day')}`,
    time: `${part('hour')}:${part('minute')}`,
  }
}

function operatorStatus(status: string): OperatorMissionStatus {
  if (status === 'WAITING_OPERATOR_ACCEPTANCE') return 'PENDING'
  if (status === 'IN_FLIGHT' || status === 'IN_PROGRESS' || status === 'RETURNING') return 'IN_FLIGHT'
  if (status === 'COMPLETED') return 'COMPLETED'
  if (status === 'FAILED' || status === 'CANCELLED') return 'FAILED'
  if (status === 'RESOURCE_ASSIGNING') return 'REJECTED'
  return 'ACCEPTED'
}

export function toOperatorMission(source: BackendMission): OperatorMission {
  const start = source.scheduledStartAt ?? source.startedAt ?? source.completedAt
  const scheduled = localDateAndTime(start)
  const durationSeconds = source.plan?.plannedDurationSec
  const end = start && typeof durationSeconds === 'number'
    ? localDateAndTime(new Date(new Date(start).getTime() + durationSeconds * 1000).toISOString())
    : { time: '' }
  return {
    id: source.id,
    missionCode: source.missionCode ?? source.id,
    backendStatus: source.status,
    status: operatorStatus(source.status),
    title: source.orderTitle ?? source.missionCode ?? source.id,
    location: source.address ?? '',
    date: scheduled.date,
    startTime: scheduled.time,
    endTime: end.time,
    serviceLabel: source.mediaType ?? 'Monitoring',
    droneCode: source.droneCode ?? null,
    droneName: source.droneCode ?? null,
    flightStartedAt: source.startedAt ?? undefined,
    completedAt: source.completedAt ?? undefined,
    rejectReason: source.rejectionReason ?? undefined,
    radiusMeters: undefined,
    ceilingMeters: source.plan?.maxPlannedAltitudeM ?? undefined,
    targetX: source.longitude,
    targetY: source.latitude,
    planSummary: source.plan
      ? {
          planningAlgorithm: source.plan.planningAlgorithm,
          feasibilityStatus: source.plan.feasibilityStatus,
          plannedDistanceM: source.plan.plannedDistanceM,
          plannedDurationSec: source.plan.plannedDurationSec,
          maxPlannedAltitudeM: source.plan.maxPlannedAltitudeM,
          estimatedEnergyMah: source.plan.estimatedEnergyMah,
          estimatedBatteryUsedPercent: source.plan.estimatedBatteryUsedPercent,
          availableBatteryPercentAtPlanning: source.plan.availableBatteryPercentAtPlanning,
          estimatedRemainingBatteryPercent: source.plan.estimatedRemainingBatteryPercent,
          waypointCount: source.plan.waypoints?.length ?? 0,
          waypoints: (source.plan.waypoints ?? [])
            .filter((point) =>
              typeof point.sequence === 'number' &&
              typeof point.simX === 'number' &&
              typeof point.simY === 'number')
            .sort((a, b) => Number(a.sequence) - Number(b.sequence))
            .map((point) => ({
              id: point.id ?? `wp-${point.sequence}`,
              sequence: Number(point.sequence),
              simX: Number(point.simX),
              simY: Number(point.simY),
              altitudeM: point.altitudeM,
              plannedSpeedMps: point.plannedSpeedMps,
              reason: point.reason,
            })),
        }
      : undefined,
  }
}

export function toFlightMission(source: BackendMission): Mission {
  const points = (source.plan?.waypoints ?? [])
    .filter((point) =>
      typeof point.sequence === 'number' &&
      typeof point.simX === 'number' &&
      typeof point.simY === 'number' &&
      typeof point.altitudeM === 'number')
    .sort((a, b) => Number(a.sequence) - Number(b.sequence))
    .map((point) => ({
      id: point.id ?? `wp-${point.sequence}`,
      sequence: Number(point.sequence),
      simX: Number(point.simX),
      simY: Number(point.simY),
      altitudeM: Number(point.altitudeM),
      speedMps: point.plannedSpeedMps,
      reason: point.reason ?? 'CRUISE',
    }))
  return {
    id: source.missionCode ?? source.id,
    backendId: source.id,
    orderRef: source.orderId ?? '',
    title: source.orderTitle ?? source.missionCode ?? source.id,
    state: source.status as Mission['state'],
    priority: 'NORMAL',
    droneId: source.droneCode ?? '',
    operatorId: source.operatorId ?? '',
    customer: source.customerName ?? '',
    location: source.address ?? '',
    lat: source.latitude ?? 0,
    lng: source.longitude ?? 0,
    scheduledAt: source.scheduledStartAt ?? '',
    estimatedMinutes: Math.round((source.plan?.plannedDurationSec ?? 0) / 60),
    distanceKm: (source.plan?.plannedDistanceM ?? 0) / 1000,
    flightPlanId: source.plan?.id ?? '',
    maxAltitudeM: source.plan?.maxPlannedAltitudeM ?? 0,
    notes: source.description ?? '',
    routePoints: points,
  }
}

export function toFlightDrone(source: BackendMission): Drone {
  const code = source.droneCode ?? ''
  return {
    id: code,
    name: code,
    model: 'Assigned mission drone',
    serialNumber: '',
    state: source.status === 'IN_FLIGHT' ? 'ACTIVE_MISSION' : 'PREFLIGHT',
    battery: 0,
    gpsCount: 0,
    gpsHdop: 0,
    altitude: 0,
    groundSpeed: 0,
    verticalSpeed: 0,
    heading: 0,
    lat: source.latitude ?? 0,
    lng: source.longitude ?? 0,
    storageMB: 0,
    telemetryAge: 0,
    cameraOk: false,
    gimbalOk: false,
    rssi: 0,
    voltage: 0,
    currentAmps: 0,
    tempC: 0,
  }
}
