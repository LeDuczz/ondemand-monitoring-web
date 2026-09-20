import { useEffect, useState } from 'react'
import { env } from '../../../config/env'
import type {
  Screen,
  Mission,
  Drone,
  FlightToken,
  ChecklistScenario,
  OperatorMission,
  OperatorProfile,
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
import missionsJson from '../../../mocks/data/operator-missions.json'

import OperatorSidebar, {
  BREADCRUMB_LABELS,
} from './components/OperatorSidebar'

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
import AvailabilityPage from './screens/AvailabilityPage'
import PreflightChecklist from './screens/PreflightChecklist'
import NotificationsPage from './screens/NotificationsPage'
import ProfilePage from './screens/ProfilePage'

const OP_MISSIONS: OperatorMission[] =
  missionsJson.missions as OperatorMission[]
const OP_PROFILE: OperatorProfile = missionsJson.operator as OperatorProfile

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
    routePoints:
      routePoints.length > 0 ? routePoints : MISSION_PRIMARY.routePoints,
  }
}

export default function OperatorWorkspace() {
  const [screen, setScreen] = useState<Screen>('mission-list')
  const [scenario] = useState<ChecklistScenario>('all-pass')
  const [mission, setMission] = useState<Mission>({ ...ALL_MISSIONS[0] })
  const [drone, setDrone] = useState<Drone>({ ...DRONE_PRIMARY })
  const [token, setToken] = useState<FlightToken | null>(null)
  const [failReason, setFailReason] = useState('Pre-flight hardware failure')
  const [dark, setDark] = useState(
    () => document.documentElement.dataset.theme === 'dark',
  )

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light'
  }, [dark])

  useEffect(() => {
    let cancelled = false

    async function loadMissionFromBackend() {
      try {
        const response = await fetch(
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

  // New operator-flow state
  const [opMissions, setOpMissions] = useState<OperatorMission[]>(OP_MISSIONS)
  const [selectedOpMission, setSelectedOpMission] =
    useState<OperatorMission | null>(null)

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

  function handleTopNavChange(s: Screen) {
    setScreen(s)
  }

  function handleSelectMission(m: Mission) {
    setMission({ ...m })
    setDrone({ ...droneForScenario[scenario] })
    setScreen('mission-detail')
  }

  function handleOpMissionView(m: OperatorMission) {
    setSelectedOpMission(m)
    setScreen('mission-detail')
  }

  function handleAccept() {
    setMission((m) => ({ ...m, state: 'RESOURCE_ASSIGNING' }))
    setDrone({ ...droneForScenario[scenario] })
    setScreen('gcs-connect')
  }

  function handleOpAccept(id: string) {
    setOpMissions((prev) =>
      prev.map((m) => (m.id === id ? { ...m, state: 'SCHEDULED' } : m)),
    )
    if (selectedOpMission?.id === id) {
      setSelectedOpMission((prev) =>
        prev ? { ...prev, state: 'SCHEDULED' } : prev,
      )
    }
  }

  function handleOpReject(id: string, reason: string, _notes?: string) {
    setOpMissions((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, state: 'CANCELLED', rejectionReason: reason } : m,
      ),
    )
    setScreen('mission-list')
  }

  function handleReject(reason: string) {
    setMission((m) => ({ ...m, state: 'CANCELLED', rejectionReason: reason }))
    setScreen('mission-list')
  }

  function handleGCSConnected() {
    setScreen('control-handover')
  }

  function handleHandoverComplete() {
    const t = makeToken(mission.id, drone.id)
    setToken(t)
    setScreen('preflight')
  }

  function handleStartMission() {
    setMission((m) => ({ ...m, state: 'IN_FLIGHT' }))
    setScreen('in-flight')
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

  function handleReplaceDrone(replacement: Drone) {
    setDrone({ ...replacement })
    setScreen('preflight')
  }

  const checklist = CHECKLIST[scenario]
  const isImmersive = screen === 'in-flight'
  const pendingCount = opMissions.filter(
    (m) => m.state === 'WAITING_OPERATOR_ACCEPTANCE',
  ).length

  // Build a compatible OperatorMission for the current selected mission for new screens
  const activeMission: OperatorMission = selectedOpMission ?? {
    id: mission.id,
    orderRef: mission.orderRef,
    title: mission.title,
    subtitle: mission.notes ?? '',
    state: displayMission.state,
    scheduledAt: mission.scheduledAt,
    endAt: new Date(
      new Date(mission.scheduledAt).getTime() +
        mission.estimatedMinutes * 60000,
    ).toISOString(),
    estimatedMinutes: mission.estimatedMinutes,
    location: mission.location,
    droneId: displayDrone.id,
    droneName: displayDrone.name,
    droneModel: displayDrone.model,
    payload: 'Zenmuse H20T',
    stationName: 'Trạm Nhà Bè',
    stationDistanceKm: mission.distanceKm,
    droneBattery: displayDrone.battery,
    droneHoursFromMaintenance: 38,
    droneStatus: displayDrone.state,
    lat: mission.lat,
    lng: mission.lng,
    surveillanceRadiusM: 300,
    maxAltitudeM: mission.maxAltitudeM,
    photoCount: 40,
    photoSpec: 'nhiệt',
    videoCount: 1,
    videoDurationSec: 180,
    videoResolution: '1080p',
    managerNote: mission.notes ?? null,
    managerName: 'Lê Thị Thanh Hằng',
    responseDeadline: null,
  }

  // The in-flight console is a full-screen immersive experience — no
  // sidebar, no ODM retheme, keeps its own dark indigo palette.
  if (isImmersive) {
    return (
      <div
        className="dark-ws"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          overflow: 'hidden',
          fontFamily: 'var(--font-ui)',
          background: 'var(--bg)',
        }}
      >
        <div
          style={{
            height: 3,
            background: 'linear-gradient(90deg,#4f46e5,#2563eb,#06b6d4)',
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
          <InFlightControl
            mission={displayMission}
            drone={displayDrone}
            onRTB={handleRTB}
            onEmergency={handleEmergency}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="odm odm-opr odm-opr-scope" style={{ height: '100vh', overflow: 'hidden' }}>
      <div className="odm-opr-shell">
        <OperatorSidebar
          screen={screen}
          onNavigate={handleTopNavChange}
          pendingCount={pendingCount}
          notificationCount={pendingCount}
        />
        <div className="odm-opr-main">
          <div
            className="odm-opr-breadcrumb"
            style={{ display: 'flex', alignItems: 'center', gap: 12 }}
          >
            <span style={{ flex: 1 }}>
              Phi công · {BREADCRUMB_LABELS[screen] ?? ''}
            </span>
            <button
              type="button"
              className="odm-btn odm-btn-gh odm-btn-ic1"
              aria-label="Đổi giao diện sáng / tối"
              onClick={() => setDark((v) => !v)}
            >
              {dark ? '☀' : '☾'}
            </button>
          </div>

          <div className="odm-opr-content">
        {/* Operator overview */}
        {screen === 'operator-overview' && (
          <OperatorOverview
            onGoMissions={() => setScreen('mission-list')}
            onGoMission={handleSelectMission}
          />
        )}

        {/* New OPR-01 mission list */}
        {screen === 'mission-list' && (
          <MissionList
            profile={OP_PROFILE}
            missions={opMissions}
            onView={handleOpMissionView}
            onGoAvailability={() => setScreen('availability')}
          />
        )}

        {/* New OPR-02 mission detail */}
        {screen === 'mission-detail' && selectedOpMission && (
          <MissionDetail
            mission={selectedOpMission}
            onBack={() => setScreen('mission-list')}
            onAccept={handleOpAccept}
            onReject={handleOpReject}
            onContinue={(m) => {
              setSelectedOpMission(m)
              setScreen('gcs-connect')
            }}
          />
        )}

        {/* OPR-03 availability */}
        {screen === 'availability' && <AvailabilityPage />}

        {/* Legacy accept-reject (from demo bar) */}
        {screen === 'accept-reject' && (
          <AcceptReject
            mission={displayMission}
            drone={displayDrone}
            onAccept={handleAccept}
            onReject={handleReject}
            onBack={() => setScreen('mission-detail')}
          />
        )}

        {/* OPR-04 GCS connect */}
        {screen === 'gcs-connect' && (
          <GCSConnection
            mission={activeMission}
            onConnected={handleGCSConnected}
            onBack={() => setScreen('mission-detail')}
          />
        )}

        {/* OPR-06 preflight checklist (new) */}
        {screen === 'preflight' && selectedOpMission && (
          <PreflightChecklist
            mission={activeMission}
            onPass={() => setScreen('ready-to-fly')}
            onFail={() => setScreen('preflight-failure')}
            onBack={() => setScreen('control-handover')}
          />
        )}

        {/* Legacy preflight with no selected op mission */}
        {screen === 'preflight' && !selectedOpMission && (
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

        {/* OPR-05 control handover */}
        {screen === 'control-handover' && (
          <ControlHandover
            mission={activeMission}
            onComplete={handleHandoverComplete}
            onBack={() => setScreen('gcs-connect')}
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
        {screen === 'return-to-base' && (
          <ReturnToBase drone={displayDrone} onLanded={handleLanded} />
        )}

        {/* OPR-09 postflight */}
        {screen === 'postflight' && (
          <PostflightCheck
            mission={activeMission}
            onComplete={handlePostflightComplete}
            onBack={() => setScreen('media-upload')}
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

        {/* OPR-08 media upload */}
        {screen === 'media-upload' && (
          <MediaUpload
            mission={activeMission}
            onDone={() => setScreen('postflight')}
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

        {/* Account: notifications & profile */}
        {screen === 'notifications' && <NotificationsPage />}
        {screen === 'profile' && <ProfilePage profile={OP_PROFILE} />}
          </div>
        </div>
      </div>
    </div>
  )
}
