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

function adaptBackendMission(mission: BackendMission): Mission {
  const plan = mission.plan
  const routePoints = (plan?.waypoints ?? [])
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
    }))
  const routeTargetPoint =
    routePoints.find((point) => point.reason?.toUpperCase() === 'TARGET') ??
    routePoints[routePoints.length - 1]

  return {
    id: mission.missionCode ?? mission.id,
    orderRef: mission.orderId ?? MISSION_PRIMARY.orderRef,
    orderTitle: mission.orderTitle,
    title: mission.orderTitle ?? MISSION_PRIMARY.title,
    state: mission.status ?? MISSION_PRIMARY.state,
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
  const [screen, setScreen] = useState<Screen>('in-flight')
  const [navId, setNavId] = useState<NavId>('mission-control')
  const [scenario, setScenario] = useState<ChecklistScenario>('all-pass')
  const [mission, setMission] = useState<Mission>({ ...ALL_MISSIONS[0] })
  const [allMissions, setAllMissions] = useState<Mission[]>([...ALL_MISSIONS])
  const [missionsLoading, setMissionsLoading] = useState(false)
  const [drone, setDrone] = useState<Drone>({ ...DRONE_PRIMARY })
  const [token, setToken] = useState<FlightToken | null>(null)
  const [failReason, setFailReason] = useState('Pre-flight hardware failure')

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
        setMission(adaptBackendMission(payload.data))
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
        const adapted = payload.data.map(adaptBackendMission)
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
    if (s === 'ready-to-fly' && !token) {
      setToken(makeToken(mission.id, drone.id))
    }
    setScreen(s)
  }

  function handleNavChange(id: NavId, s?: Screen) {
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
      setMission(detailedMission)
      setAllMissions((missions) =>
        missions.map((missionItem) =>
          missionItem.id === detailedMission.id ? detailedMission : missionItem,
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

  const SCENARIO_OPTIONS: { id: ChecklistScenario; label: string }[] = [
    { id: 'all-pass', label: 'All Pass' },
    { id: 'battery-fail', label: 'Battery Fail' },
    { id: 'hardware-fail', label: 'Hardware Fail' },
    { id: 'telemetry-stale', label: 'Telemetry Stale' },
    { id: 'weather-warn', label: 'Weather Warn' },
  ]

  const OPERATOR_SCREENS: [Screen, string][] = [
    ['operator-overview', 'Overview'],
    ['mission-list', 'Missions'],
    ['mission-detail', 'Detail'],
    ['accept-reject', 'Accept/Reject'],
    ['gcs-connect', 'GCS Connect'],
    ['preflight', 'Pre-flight'],
    ['preflight-failure', 'PF Failure'],
    ['drone-replacement', 'Replace Drone'],
    ['control-handover', 'Handover'],
    ['ready-to-fly', 'Ready to Fly'],
    ['in-flight', 'In-Flight'],
    ['return-to-base', 'RTB'],
    ['postflight', 'Post-flight'],
    ['mission-completed', 'Completed'],
    ['mission-failed', 'Failed'],
    ['media-upload', 'Media Upload'],
    ['manual-upload', 'Manual Upload'],
    ['simulation-zones', 'Zone Map'],
  ]

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: 'var(--font-ui)',
        background: 'var(--bg)',
      }}
    >
      <Sidebar
        role="operator"
        active={navId}
        onChange={handleNavChange}
        alerts={1}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
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

        {/* Demo bar — hidden during GCS flight view */}
        {!isDark && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 0,
              padding: '5px 12px',
              background: '#f1f3f5',
              borderTop: '1px solid #e5e7eb',
              flexShrink: 0,
              overflowX: 'auto',
            }}
          >
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                marginRight: 5,
                flexShrink: 0,
              }}
            >
              Role:
            </span>
            <span
              style={{
                flexShrink: 0,
                padding: '3px 8px',
                borderRadius: 4,
                fontSize: 9,
                fontWeight: 600,
                marginRight: 2,
                background: '#111827',
                color: '#fff',
                border: '1px solid #111827',
              }}
            >
              Drone Operator
            </span>

            <div
              style={{
                width: 1,
                height: 14,
                background: '#d1d5db',
                margin: '0 8px',
                flexShrink: 0,
              }}
            />

            {/* Screen nav (operator-relevant) */}
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                marginRight: 4,
                flexShrink: 0,
              }}
            >
              Screen:
            </span>
            {OPERATOR_SCREENS.map(([s, label]) => (
              <button
                key={s}
                onClick={() => goScreen(s)}
                style={{
                  flexShrink: 0,
                  padding: '3px 8px',
                  borderRadius: 4,
                  fontSize: 9,
                  fontWeight: 500,
                  cursor: 'pointer',
                  marginRight: 2,
                  background: screen === s ? '#4f46e5' : 'transparent',
                  color: screen === s ? '#fff' : '#6b7280',
                  border: '1px solid transparent',
                  transition: 'all .1s',
                }}
              >
                {label}
              </button>
            ))}

            <div
              style={{
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 9, fontWeight: 600, color: '#9ca3af' }}>
                Preflight:
              </span>
              {SCENARIO_OPTIONS.map((o) => (
                <button
                  key={o.id}
                  onClick={() => setScenario(o.id)}
                  style={{
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 9,
                    fontWeight: 500,
                    cursor: 'pointer',
                    background: scenario === o.id ? '#fffbeb' : 'transparent',
                    color: scenario === o.id ? '#92400e' : '#9ca3af',
                    border:
                      scenario === o.id
                        ? '1px solid #fde68a'
                        : '1px solid transparent',
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
