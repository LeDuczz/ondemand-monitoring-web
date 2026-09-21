import { useEffect, useState } from 'react'
import { env } from '../../../config/env'
import { authenticatedFetch } from '../../auth/api/authApi'
import type {
  Screen,
  Mission,
  Drone,
  FlightToken,
  ChecklistScenario,
  NavId,
} from './types'
import {
  DRONE_PRIMARY,
  DRONE_BATTERY_LOW,
  DRONE_HW_FAULT,
  DRONE_STALE_TEL,
  MISSION_PRIMARY,
  ALL_MISSIONS,
  CHECKLIST,
  REPLACEMENT_DRONES,
} from './mockData'

import Sidebar from './components/Sidebar'

import OperatorOverview from './screens/OperatorOverview'
import MissionList from './screens/MissionList'
import MissionDetail from './screens/MissionDetail'
import AcceptReject from './screens/AcceptReject'
import GCSConnection from './screens/GCSConnection'
import PreflightFailure from './screens/PreflightFailure'
import DroneReplacement from './screens/DroneReplacement'
import ControlHandover from './screens/ControlHandover'
import ReadyToFly from './screens/ReadyToFly'
import InFlightControl from './screens/InFlightControl'
import ReturnToBase from './screens/ReturnToBase'
import PostflightCheck from './screens/PostflightCheck'
import MissionCompleted from './screens/MissionCompleted'
import MissionFailed from './screens/MissionFailed'
import MediaUpload from './screens/MediaUpload'
import ManualUpload from './screens/ManualUpload'
import SimulationZones from './screens/SimulationZones'

function makeToken(missionId: string, droneId: string): FlightToken {
  const now = Date.now()
  return {
    token: `FT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    issuedAt: now,
    expiresAt: now + 15 * 60 * 1000,
    missionId,
    droneId,
  }
}

const SCREEN_MISSION_STATE: Partial<Record<Screen, Mission['state']>> = {
  'accept-reject': 'WAITING_OPERATOR_ACCEPTANCE',
  'gcs-connect': 'RESOURCE_ASSIGNING',
  preflight: 'PREFLIGHT_CHECKING',
  'preflight-failure': 'FAILED_PREFLIGHT',
  'drone-replacement': 'RESOURCE_ASSIGNING',
  'control-handover': 'PREFLIGHT_CHECKING',
  'ready-to-fly': 'READY_TO_FLY',
  'in-flight': 'IN_FLIGHT',
  'return-to-base': 'RETURNING',
  postflight: 'POSTFLIGHT_CHECKING',
  'mission-completed': 'COMPLETED',
  'mission-failed': 'FAILED',
  'media-upload': 'COMPLETED',
  'manual-upload': 'COMPLETED',
}

type BackendMission = {
  id: string
  orderId?: string
  orderTitle?: string
  customerName?: string
  missionCode?: string
  status?: Mission['state']
  operatorId?: string
  droneId?: string
  droneCode?: string
  latitude?: number
  longitude?: number
  address?: string
  scheduledStartAt?: string
  description?: string
  mediaType?: string
  plan?: {
    id?: string
    plannedDistanceM?: number
    plannedDurationSec?: number
    maxPlannedAltitudeM?: number
    waypoints?: {
      id?: string
      sequence?: number
      simX?: number
      simY?: number
      altitudeM?: number
      plannedSpeedMps?: number
      reason?: string
    }[]
  }
}

type ApiResponse<T> = {
  data: T
}

const COMPLETED_MISSION_STORAGE_KEY = 'omss.droneOperator.completedMissionIds'

type RoutePoint = Mission['routePoints'] extends (infer Point)[] | undefined
  ? Point
  : never

const IMPORTANT_ROUTE_REASONS = new Set([
  'START',
  'TARGET',
  'ORDER',
  'TARGET_APPROACH',
  'TERRAIN_CLEARANCE',
  'RETURN',
  'HOME',
])

function perpendicularDistance(
  point: RoutePoint,
  start: RoutePoint,
  end: RoutePoint,
) {
  const dx = end.simX - start.simX
  const dy = end.simY - start.simY
  if (dx === 0 && dy === 0) {
    return Math.hypot(point.simX - start.simX, point.simY - start.simY)
  }
  return (
    Math.abs(
      dy * point.simX -
        dx * point.simY +
        end.simX * start.simY -
        end.simY * start.simX,
    ) / Math.hypot(dx, dy)
  )
}

function simplifySegment(points: RoutePoint[], toleranceM: number): RoutePoint[] {
  if (points.length <= 2) return points

  let maxDistance = 0
  let splitIndex = 0
  const start = points[0]
  const end = points[points.length - 1]

  for (let index = 1; index < points.length - 1; index += 1) {
    const distance = perpendicularDistance(points[index], start, end)
    if (distance > maxDistance) {
      maxDistance = distance
      splitIndex = index
    }
  }

  if (maxDistance <= toleranceM) return [start, end]

  const left = simplifySegment(points.slice(0, splitIndex + 1), toleranceM)
  const right = simplifySegment(points.slice(splitIndex), toleranceM)
  return [...left.slice(0, -1), ...right]
}

function simplifyRoutePoints(points: RoutePoint[]) {
  if (points.length <= 30) return points

  const importantIndexes = new Set<number>([0, points.length - 1])
  points.forEach((point, index) => {
    if (IMPORTANT_ROUTE_REASONS.has(point.reason.toUpperCase())) {
      importantIndexes.add(index)
    }
  })

  const important = [...importantIndexes].sort((a, b) => a - b)
  const simplified: RoutePoint[] = []

  for (let index = 0; index < important.length - 1; index += 1) {
    const from = important[index]
    const to = important[index + 1]
    const segment = simplifySegment(points.slice(from, to + 1), 12)
    simplified.push(...(index === 0 ? segment : segment.slice(1)))
  }

  const capped =
    simplified.length <= 30
      ? simplified
      : simplified.filter((point, index) => {
          if (index === 0 || index === simplified.length - 1) return true
          if (IMPORTANT_ROUTE_REASONS.has(point.reason.toUpperCase())) return true
          const keepEvery = Math.ceil(simplified.length / 30)
          return index % keepEvery === 0
        })

  return capped.map((point, index) => ({
    ...point,
    sequence: index,
    id: `${point.id}-op-${index}`,
  }))
}

function adaptBackendMission(mission: BackendMission): Mission {
  const plan = mission.plan
  const routePoints = simplifyRoutePoints((plan?.waypoints ?? [])
    .filter(
      (point) =>
        typeof point.sequence === 'number' &&
        typeof point.simX === 'number' &&
        typeof point.simY === 'number' &&
        typeof point.altitudeM === 'number',
    )
    .sort((a, b) => Number(a.sequence) - Number(b.sequence))
    .map((point) => ({
      id: point.id ?? `wp-${point.sequence}`,
      sequence: Number(point.sequence),
      simX: Number(point.simX),
      simY: Number(point.simY),
      altitudeM: Number(point.altitudeM),
      speedMps:
        typeof point.plannedSpeedMps === 'number'
          ? point.plannedSpeedMps
          : undefined,
      reason: point.reason ?? 'CRUISE',
    })))
  const routeTargetPoint =
    routePoints.find((point) => point.reason?.toUpperCase() === 'TARGET') ??
    routePoints.find((point) => point.reason?.toUpperCase() === 'ORDER') ??
    routePoints[routePoints.length - 1]
  const plannedStatus =
    mission.status === 'WAITING_OPERATOR_ACCEPTANCE' && routePoints.length > 0
      ? 'SCHEDULED'
      : mission.status

  return {
    id: mission.missionCode ?? mission.id,
    backendId: mission.id,
    orderRef: mission.orderId ?? MISSION_PRIMARY.orderRef,
    orderTitle: mission.orderTitle,
    title: mission.orderTitle ?? MISSION_PRIMARY.title,
    state: plannedStatus ?? MISSION_PRIMARY.state,
    priority: MISSION_PRIMARY.priority,
    droneId: mission.droneCode ?? mission.droneId ?? MISSION_PRIMARY.droneId,
    operatorId: mission.operatorId ?? MISSION_PRIMARY.operatorId,
    customer: mission.customerName ?? MISSION_PRIMARY.customer,
    location: mission.address ?? MISSION_PRIMARY.location,
    lat: mission.latitude ?? MISSION_PRIMARY.lat,
    lng: mission.longitude ?? MISSION_PRIMARY.lng,
    scheduledAt: mission.scheduledStartAt ?? MISSION_PRIMARY.scheduledAt,
    estimatedMinutes:
      typeof plan?.plannedDurationSec === 'number'
        ? Math.max(1, Math.round(plan.plannedDurationSec / 60))
        : MISSION_PRIMARY.estimatedMinutes,
    distanceKm:
      typeof plan?.plannedDistanceM === 'number'
        ? plan.plannedDistanceM / 1000
        : MISSION_PRIMARY.distanceKm,
    flightPlanId: plan?.id ?? MISSION_PRIMARY.flightPlanId,
    maxAltitudeM:
      typeof plan?.maxPlannedAltitudeM === 'number'
        ? plan.maxPlannedAltitudeM
        : MISSION_PRIMARY.maxAltitudeM,
    notes: mission.description ?? MISSION_PRIMARY.notes,
    targetSimX: routeTargetPoint?.simX ?? MISSION_PRIMARY.targetSimX,
    targetSimY: routeTargetPoint?.simY ?? MISSION_PRIMARY.targetSimY,
    routePoints: routePoints.length > 0 ? routePoints : MISSION_PRIMARY.routePoints,
  }
}

export default function OperatorWorkspace() {
  const [completedMissionIds, setCompletedMissionIds] = useState<Set<string>>(() => {
    try {
      const raw = window.localStorage.getItem(COMPLETED_MISSION_STORAGE_KEY)
      const parsed = raw ? JSON.parse(raw) : []
      return new Set(Array.isArray(parsed) ? parsed.map(String) : [])
    } catch {
      return new Set()
    }
  })
  const [screen, setScreen] = useState<Screen>('mission-list')
  const [navId, setNavId] = useState<NavId>('my-missions')
  const [scenario] = useState<ChecklistScenario>('all-pass')
  const [mission, setMission] = useState<Mission>({ ...ALL_MISSIONS[0] })
  const [allMissions, setAllMissions] = useState<Mission[]>([...ALL_MISSIONS])
  const [missionsLoading, setMissionsLoading] = useState(false)
  const [drone, setDrone] = useState<Drone>({ ...DRONE_PRIMARY })
  const [token, setToken] = useState<FlightToken | null>(null)
  const [failReason, setFailReason] = useState('Pre-flight hardware failure')
  const [autoStartPlanRequested, setAutoStartPlanRequested] = useState(false)
  const [flightSessionStarted, setFlightSessionStarted] = useState(false)

  function applyLocalCompletionState(missionItem: Mission) {
    if (
      completedMissionIds.has(missionItem.id) ||
      (missionItem.backendId && completedMissionIds.has(missionItem.backendId))
    ) {
      return { ...missionItem, state: 'COMPLETED' as const }
    }
    return missionItem
  }

  function rememberCompletedMission(missionItem: Mission) {
    setCompletedMissionIds((current) => {
      const next = new Set(current)
      next.add(missionItem.id)
      if (missionItem.backendId) next.add(missionItem.backendId)
      try {
        window.localStorage.setItem(
          COMPLETED_MISSION_STORAGE_KEY,
          JSON.stringify([...next]),
        )
      } catch {
        // Keep in-memory completion state even if localStorage is unavailable.
      }
      return next
    })
  }

  // Load single mission detail (for mission-control screen)
  useEffect(() => {
    let cancelled = false

    async function loadMissionFromBackend() {
      try {
        const response = await authenticatedFetch(
          `${env.apiBaseUrl}/api/missions/code/${encodeURIComponent(
            MISSION_PRIMARY.id,
          )}`,
        )
        if (!response.ok) return
        const payload = (await response.json()) as ApiResponse<BackendMission>
        if (cancelled || !payload.data) return
        setMission(applyLocalCompletionState(adaptBackendMission(payload.data)))
      } catch {
        // Keep the built-in demo mission when the backend is not running.
      }
    }

    loadMissionFromBackend()

    return () => {
      cancelled = true
    }
  }, [])

  // Load missions list for "My Missions" screen (GET /api/missions?operatorId=...)
  useEffect(() => {
    let cancelled = false

    async function loadAllMissions() {
      setMissionsLoading(true)
      try {
        const operatorId = MISSION_PRIMARY.operatorId ?? 'OP-001'
        const response = await authenticatedFetch(
          `${env.apiBaseUrl}/api/missions?operatorId=${encodeURIComponent(operatorId)}`,
        )
        if (!response.ok) return
        const payload = (await response.json()) as ApiResponse<BackendMission[]>
        if (cancelled || !payload.data || !Array.isArray(payload.data)) return
        const adapted = payload.data
          .map(adaptBackendMission)
          .map(applyLocalCompletionState)
        if (adapted.length > 0) setAllMissions(adapted)
      } catch {
        // Keep the built-in demo missions when the backend is not running.
      } finally {
        if (!cancelled) setMissionsLoading(false)
      }
    }

    loadAllMissions()

    return () => {
      cancelled = true
    }
  }, [])

  const droneForScenario: Record<ChecklistScenario, Drone> = {
    'all-pass': DRONE_PRIMARY,
    'battery-fail': DRONE_BATTERY_LOW,
    'hardware-fail': DRONE_HW_FAULT,
    'telemetry-stale': DRONE_STALE_TEL,
    'weather-warn': DRONE_PRIMARY,
  }

  const displayMission: Mission = {
    ...mission,
    state: SCREEN_MISSION_STATE[screen] ?? mission.state,
  }

  const displayDrone: Drone = {
    ...drone,
    state: (() => {
      if (screen === 'in-flight' || screen === 'return-to-base')
        return 'ACTIVE_MISSION'
      if (
        [
          'gcs-connect',
          'preflight',
          'control-handover',
          'ready-to-fly',
          'preflight-failure',
          'drone-replacement',
        ].includes(screen)
      )
        return 'PREFLIGHT'
      if (screen === 'mission-failed') return drone.state
      return 'AVAILABLE'
    })(),
  }

  function goScreen(s: Screen) {
    if (s === 'in-flight' && !flightSessionStarted) {
      setScreen('mission-detail')
      setNavId('my-missions')
      return
    }
    if (s === 'ready-to-fly' && !token) {
      setToken(makeToken(mission.id, drone.id))
    }
    setScreen(s)
  }

  function handleNavChange(id: NavId, s?: Screen) {
    if (id === 'mission-control' || s === 'in-flight') {
      if (flightSessionStarted) {
        setNavId('mission-control')
        setScreen('in-flight')
      } else {
        setNavId('my-missions')
        setScreen('mission-detail')
      }
      return
    }

    setNavId(id)
    if (s) {
      setScreen(s)
      return
    }
    if (id === 'my-missions') setScreen('mission-list')
    else if (id === 'zone-map') setScreen('simulation-zones')
    else if (id === 'dashboard') setScreen('operator-overview')
    else setScreen('operator-overview')
  }

  async function handleSelectMission(m: Mission) {
    setMission({ ...m })
    setDrone({ ...droneForScenario[scenario] })
    setFlightSessionStarted(false)
    setAutoStartPlanRequested(false)
    setScreen('mission-detail')
    setNavId('my-missions')

    try {
      const response = await authenticatedFetch(
        `${env.apiBaseUrl}/api/missions/code/${encodeURIComponent(m.id)}`,
      )
      if (!response.ok) return
      const payload = (await response.json()) as ApiResponse<BackendMission>
      if (!payload.data) return
      const detailedMission = adaptBackendMission(payload.data)
      const visibleMission = applyLocalCompletionState(detailedMission)
      setMission(visibleMission)
      setAllMissions((missions) =>
        missions.map((missionItem) =>
          missionItem.id === visibleMission.id ? visibleMission : missionItem,
        ),
      )
    } catch {
      // Keep the selected mission from the list when detail loading is unavailable.
    }
  }

  function handleAccept() {
    setMission((m) => ({ ...m, state: 'RESOURCE_ASSIGNING' }))
    setDrone({ ...droneForScenario[scenario] })
    setScreen('gcs-connect')
  }

  function handleReject(reason: string) {
    setMission((m) => ({ ...m, state: 'CANCELLED', rejectionReason: reason }))
    setScreen('mission-list')
  }

  function handleGCSConnected() {
    setScreen('preflight')
  }
  function handleHandoverComplete() {
    const t = makeToken(mission.id, drone.id)
    setToken(t)
    setScreen('ready-to-fly')
  }

  function handleStartMission() {
    setMission((m) => ({ ...m, state: 'IN_FLIGHT' }))
    setFlightSessionStarted(true)
    setAutoStartPlanRequested(true)
    setScreen('in-flight')
    setNavId('mission-control')
  }

  async function handleCompleteMission() {
    const backendMissionId = mission.backendId ?? mission.id
    try {
      const response = await authenticatedFetch(
        `${env.apiBaseUrl}/api/missions/${encodeURIComponent(backendMissionId)}/complete`,
        { method: 'POST' },
      )
      if (response.ok) {
        const payload = (await response.json()) as ApiResponse<BackendMission>
        if (payload.data) {
          const completedMission = adaptBackendMission(payload.data)
          setMission(completedMission)
          setAllMissions((missions) =>
            missions.map((missionItem) =>
              missionItem.id === completedMission.id
                ? completedMission
                : missionItem,
            ),
          )
        }
      }
    } catch {
      // Keep the local completion flow available when the demo API is offline.
    }
    rememberCompletedMission(mission)
    setMission((m) => ({ ...m, state: 'COMPLETED' }))
    setAllMissions((missions) =>
      missions.map((missionItem) =>
        missionItem.id === mission.id
          ? { ...missionItem, state: 'COMPLETED' }
          : missionItem,
      ),
    )
    setFlightSessionStarted(false)
    setAutoStartPlanRequested(false)
    setScreen('mission-completed')
    setNavId('my-missions')
  }

  function handleRuntimePreflightReady() {
    setMission((m) => ({ ...m, state: 'IN_FLIGHT' }))
    setFlightSessionStarted(true)
    setAutoStartPlanRequested(true)
    setScreen('in-flight')
    setNavId('mission-control')
  }

  function handleRTB() {
    setMission((m) => ({ ...m, state: 'RETURNING' }))
    setScreen('return-to-base')
  }

  function handleEmergency() {
    setMission((m) => ({ ...m, state: 'FAILED' }))
    setFailReason('Emergency stop — operator abort')
    setScreen('mission-failed')
  }

  function handleLanded() {
    setScreen('postflight')
  }

  function handlePostflightComplete() {
    setMission((m) => ({ ...m, state: 'COMPLETED' }))
    setScreen('mission-completed')
  }

  function handlePostflightFault() {
    setDrone((d) => ({ ...d, state: 'MAINTENANCE' }))
    setFailReason('Post-flight hardware fault detected')
    setScreen('mission-failed')
  }

  function handleReplaceDrone(replacement: Drone) {
    setDrone({ ...replacement })
    setScreen('preflight')
  }

  const checklist = CHECKLIST[scenario]
  const isDark = screen === 'in-flight'


  return (
    <div
      className="portal-shell"
      style={{ fontFamily: 'var(--font-ui)' }}
    >
      <Sidebar
        role="operator"
        active={navId}
        onChange={handleNavChange}
        alerts={1}
      />

      <main className="portal-main" style={{ padding: 0 }}>
        {/* Mission Control transition banner */}
        {isDark && (
          <div
            style={{
              height: 3,
              background: 'linear-gradient(90deg,#4f46e5,#2563eb,#06b6d4)',
              flexShrink: 0,
            }}
          />
        )}

        <div
          className={isDark ? 'dark-ws' : ''}
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {/* Operator overview */}
          {screen === 'operator-overview' && (
            <OperatorOverview
              allMissions={allMissions}
              onGoMissions={() => {
                setScreen('mission-list')
                setNavId('my-missions')
              }}
              onGoMission={handleSelectMission}
            />
          )}

          {/* Operator flow */}
          {screen === 'mission-list' && (
            <MissionList
              missions={missionsLoading ? [] : allMissions}
              onSelect={handleSelectMission}
              onScreen={goScreen}
            />
          )}
          {screen === 'mission-detail' && (
            <MissionDetail
              mission={displayMission}
              drone={displayDrone}
              onScreen={goScreen}
              onBack={() => setScreen('mission-list')}
              onStartFlight={handleStartMission}
            />
          )}
          {screen === 'accept-reject' && (
            <AcceptReject
              mission={displayMission}
              drone={displayDrone}
              onAccept={handleAccept}
              onReject={handleReject}
              onBack={() => setScreen('mission-detail')}
            />
          )}
          {screen === 'gcs-connect' && (
            <GCSConnection
              mission={displayMission}
              drone={displayDrone}
              onConnected={handleGCSConnected}
              onBack={() => setScreen('mission-detail')}
            />
          )}
          {screen === 'preflight' && (
            <InFlightControl
              mission={displayMission}
              drone={displayDrone}
              onRTB={handleRTB}
              onEmergency={handleEmergency}
              autoStartPlan={false}
              onAutoStartPlanConsumed={() => undefined}
              onPreflightReady={handleRuntimePreflightReady}
            />
          )}
          {screen === 'preflight-failure' && (
            <PreflightFailure
              checklist={checklist}
              scenario={scenario}
              onReplace={() => setScreen('drone-replacement')}
              onEscalate={() => setScreen('mission-list')}
              onBack={() => setScreen('preflight')}
            />
          )}
          {screen === 'drone-replacement' && (
            <DroneReplacement
              current={displayDrone}
              replacements={REPLACEMENT_DRONES}
              onSelect={handleReplaceDrone}
              onBack={() => setScreen('preflight-failure')}
            />
          )}
          {screen === 'control-handover' && (
            <ControlHandover
              mission={displayMission}
              drone={displayDrone}
              onComplete={handleHandoverComplete}
              onBack={() => setScreen('preflight')}
            />
          )}
          {screen === 'ready-to-fly' && token && (
            <ReadyToFly
              mission={displayMission}
              drone={displayDrone}
              token={token}
              onStart={handleStartMission}
              onAbort={() => setScreen('control-handover')}
            />
          )}
          {screen === 'in-flight' && (
            <InFlightControl
              mission={displayMission}
              drone={displayDrone}
              onRTB={handleRTB}
              onEmergency={handleEmergency}
              autoStartPlan={autoStartPlanRequested}
              onAutoStartPlanConsumed={() => setAutoStartPlanRequested(false)}
              onCompleteMission={handleCompleteMission}
            />
          )}
          {screen === 'return-to-base' && (
            <ReturnToBase drone={displayDrone} onLanded={handleLanded} />
          )}
          {screen === 'postflight' && (
            <PostflightCheck
              drone={displayDrone}
              onComplete={handlePostflightComplete}
              onFault={handlePostflightFault}
            />
          )}
          {screen === 'mission-completed' && (
            <MissionCompleted
              mission={displayMission}
              drone={displayDrone}
              onMedia={() => setScreen('media-upload')}
              onMissions={() => setScreen('mission-list')}
            />
          )}
          {screen === 'mission-failed' && (
            <MissionFailed
              mission={displayMission}
              drone={displayDrone}
              reason={failReason}
              onSubmit={() => setScreen('mission-list')}
              onMissions={() => setScreen('mission-list')}
            />
          )}
          {screen === 'media-upload' && (
            <MediaUpload
              mission={displayMission}
              onDone={() => setScreen('mission-list')}
              onManual={() => setScreen('manual-upload')}
            />
          )}
          {screen === 'manual-upload' && (
            <ManualUpload
              missionId={mission.id}
              onComplete={() => setScreen('mission-list')}
              onBack={() => setScreen('media-upload')}
            />
          )}
          {screen === 'simulation-zones' && <SimulationZones />}
        </div>

      </main>
    </div>
  )
}




