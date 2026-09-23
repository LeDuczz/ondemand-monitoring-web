import {
  Fragment,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { env } from '../../../../config/env'
import type { Drone, Mission, MissionRoutePoint } from '../types'
import { PreflightChecklistPanel } from '../../pages/PreflightScreen'
import { operatorHref } from '../../routes'

interface Props {
  mission: Mission
  drone: Drone
  onRTB: () => void
  onEmergency: () => void
  autoStartPlan: boolean
  onAutoStartPlanConsumed: () => void
  onPreflightReady?: () => void
  onCompleteMission?: () => void
}

type FlightCommand =
  | 'takeoff'
  | 'forward'
  | 'back'
  | 'left'
  | 'right'
  | 'up'
  | 'down'
  | 'yaw_left'
  | 'yaw_right'
  | 'stop'
  | 'land'
  | 'return_to_base'
  | 'emergency_stop'
  | 'auto_plan_start'
  | 'camera_switch'
  | 'camera_monitor_toggle'
  | 'lidar_monitor_toggle'
  | 'telemetry_monitor_toggle'
  | 'photo'
  | 'video_toggle'
  | 'speed_up'
  | 'speed_down'
  | 'safety_toggle'
  | 'thermal_toggle'

type WeatherPreset =
  | 'CLEAR_DAY'
  | 'CLOUDY'
  | 'FOGGY'
  | 'WINDY'
  | 'LIGHT_RAIN'
  | 'HEAVY_RAIN'

type IconName =
  | 'drone'
  | 'settings'
  | 'crosshair'
  | 'camera'
  | 'eye'
  | 'joystick'
  | 'map'
  | 'plus'
  | 'minus'
  | 'takeoff'
  | 'land'
  | 'alert'
  | 'arrowUp'
  | 'arrowDown'
  | 'arrowLeft'
  | 'arrowRight'
  | 'moveForward'
  | 'moveBack'
  | 'moveLeft'
  | 'moveRight'
  | 'altitudeUp'
  | 'altitudeDown'
  | 'rotateLeft'
  | 'rotateRight'
  | 'gauge'
  | 'photo'
  | 'video'
  | 'radar'
  | 'activity'
  | 'shield'
  | 'thermometer'
  | 'check'
  | 'chevronRight'

type ControlStatus = {
  online?: boolean
  positionReady?: boolean
  positionGazebo?: { x: number; y: number }
  positionNed?: { northM: number; eastM: number; downM: number }
  yawDeg?: number
  altitudeM?: number
  pressurePa?: number
  airPressurePa?: number
  speedMps?: number
  batteryPercent?: number
  batteryState?: 'NORMAL' | 'LOW' | 'CRITICAL' | 'EMERGENCY'
  batteryDrainMode?:
    'LANDED' | 'IDLE' | 'HOVER' | 'CRUISE' | 'ASCEND' | 'DESCEND'
  autoPlan?: {
    active?: boolean
    status?: string
    currentIndex?: number
    total?: number
  }
  cameraMode?: 'FRONT' | 'DOWN'
  cameraPitchDeg?: number
  thermalEnabled?: boolean
  thermalSensorOnline?: boolean
  thermalFrameAgeMs?: number | null
  thermalFps?: number | null
  thermalFrameWidth?: number | null
  thermalFrameHeight?: number | null
  minTemperatureC?: number | null
  maxTemperatureC?: number | null
  averageTemperatureC?: number | null
  thermalThresholdC?: number | null
  hotspotDetected?: boolean
  hotspotTemperatureC?: number | null
  thermalMode?: string | null
  thermalPixelFormat?: string | null
  thermalPalette?: string | null
  thermalIsothermEnabled?: boolean
  thermalDebugOverlayEnabled?: boolean
  thermalDisplayRangeMode?: string | null
  thermalDisplayMinC?: number | null
  thermalDisplayMaxC?: number | null
  thermalSourceError?: string | null
  lidar?: {
    enabled?: boolean
    available?: boolean
    status?: string
    direction?: string
    rangeMaxM?: number
    frontM?: number
    frontLeftM?: number
    frontRightM?: number
    leftM?: number
    rightM?: number
    backM?: number
    nearestM?: number
    nearestAngleDeg?: number
    nearestDirection?: string
    scanAgeS?: number | null
  }
}

type MapMeta = {
  image?: string
  imageVersion?: string
  minX: number
  maxX: number
  minY: number
  maxY: number
}

type ZonePayload = {
  id?: string
  code?: string
  name?: string
  zoneType?: string
  restricted?: boolean
  coordinates?: number[][]
}

type RestrictedZone = {
  id: string
  code: string
  name: string
  coordinates: [number, number][]
}

type GeofenceLevel = 'UNKNOWN' | 'SAFE' | 'CAUTION' | 'DANGER' | 'VIOLATION'

type GeofenceStatus = {
  level: GeofenceLevel
  zone?: RestrictedZone
  distanceM?: number
}

const controlBaseUrl =
  import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090'
const restrictedZoneTypes = new Set([
  'AIRPORT',
  'RESTRICTED',
  'NO_FLY',
  'NO-FLY',
  'NOFLY',
])
const cautionDistanceM = 50
const dangerDistanceM = 20
const px4HomeSimX = Number(import.meta.env.VITE_GEOFENCE_PX4_HOME_SIM_X_M ?? 0)
const px4HomeSimY = Number(
  import.meta.env.VITE_GEOFENCE_PX4_HOME_SIM_Y_M ?? -280,
)
const standardPressurePa = 101_325
const standardTemperatureK = 288.15
const standardLapseRateKPerM = 0.0065
const barometricExponent = 5.255877

const flightControls: {
  command: FlightCommand
  label: string
  icon: IconName
  tone?: 'danger' | 'amber'
}[] = [
  { command: 'takeoff', label: 'Take off', icon: 'takeoff' },
  { command: 'auto_plan_start', label: 'Auto Plan', icon: 'map', tone: 'amber' },
  { command: 'land', label: 'Land', icon: 'land' },
  { command: 'emergency_stop', label: 'E-Stop', icon: 'alert', tone: 'danger' },
]

const movementControls: {
  command: FlightCommand
  label: string
  icon: IconName
}[] = [
  { command: 'up', label: 'Ascend', icon: 'altitudeUp' },
  { command: 'forward', label: 'Forward', icon: 'moveForward' },
  { command: 'down', label: 'Descend', icon: 'altitudeDown' },
  { command: 'left', label: 'Left', icon: 'moveLeft' },
  { command: 'back', label: 'Back', icon: 'moveBack' },
  { command: 'right', label: 'Right', icon: 'moveRight' },
]

const rotationControls: {
  command: FlightCommand
  label: string
  icon: IconName
}[] = [
  { command: 'yaw_left', label: 'Yaw L', icon: 'rotateLeft' },
  { command: 'yaw_right', label: 'Yaw R', icon: 'rotateRight' },
  { command: 'speed_down', label: 'Speed -', icon: 'minus' },
  { command: 'speed_up', label: 'Speed +', icon: 'plus' },
]

const moreToolControls: {
  command: FlightCommand
  label: string
  icon: IconName
}[] = [
  { command: 'camera_switch', label: 'Camera', icon: 'camera' },
  { command: 'photo', label: 'Photo', icon: 'photo' },
  { command: 'video_toggle', label: 'Video', icon: 'video' },
  { command: 'lidar_monitor_toggle', label: 'LiDAR', icon: 'radar' },
  { command: 'telemetry_monitor_toggle', label: 'Telemetry', icon: 'activity' },
  { command: 'safety_toggle', label: 'Safety', icon: 'shield' },
]

const weatherControls: {
  preset: WeatherPreset
  label: string
  tone?: 'danger' | 'amber'
}[] = [
  { preset: 'CLEAR_DAY', label: 'Clear' },
  { preset: 'CLOUDY', label: 'Cloud' },
  { preset: 'FOGGY', label: 'Fog', tone: 'amber' },
  { preset: 'WINDY', label: 'Wind', tone: 'amber' },
  { preset: 'LIGHT_RAIN', label: 'Rain', tone: 'amber' },
  { preset: 'HEAVY_RAIN', label: 'Heavy', tone: 'danger' },
]

function navigateOperator(hash: string) {
  window.location.hash = hash
}

function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const common = {
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      {name === 'drone' && (
        <>
          <path {...common} d="M10 10h4v4h-4z" />
          <path {...common} d="M12 10V5M12 19v-5M10 12H5M19 12h-5" />
          <circle {...common} cx="5" cy="5" r="2" />
          <circle {...common} cx="19" cy="5" r="2" />
          <circle {...common} cx="5" cy="19" r="2" />
          <circle {...common} cx="19" cy="19" r="2" />
        </>
      )}
      {name === 'settings' && (
        <>
          <circle {...common} cx="12" cy="12" r="3" />
          <path
            {...common}
            d="M19.4 15a8 8 0 0 0 .1-2l2-1.5-2-3.5-2.4 1a8 8 0 0 0-1.7-1L15 5h-4l-.4 3a8 8 0 0 0-1.7 1l-2.4-1-2 3.5 2 1.5a8 8 0 0 0 .1 2l-2 1.5 2 3.5 2.4-1a8 8 0 0 0 1.7 1l.4 3h4l.4-3a8 8 0 0 0 1.7-1l2.4 1 2-3.5z"
          />
        </>
      )}
      {name === 'crosshair' && (
        <>
          <circle {...common} cx="12" cy="12" r="6" />
          <path {...common} d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </>
      )}
      {name === 'camera' && (
        <>
          <path {...common} d="M5 7h3l1.5-2h5L16 7h3v12H5z" />
          <circle {...common} cx="12" cy="13" r="3" />
        </>
      )}
      {name === 'eye' && (
        <>
          <path
            {...common}
            d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z"
          />
          <circle {...common} cx="12" cy="12" r="2.5" />
        </>
      )}
      {name === 'joystick' && (
        <>
          <circle {...common} cx="12" cy="7" r="3" />
          <path {...common} d="M12 10v5M7 20h10M9 15h6l2 5H7z" />
        </>
      )}
      {name === 'map' && (
        <>
          <path {...common} d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2z" />
          <path {...common} d="M9 4v14M15 6v14" />
        </>
      )}
      {name === 'plus' && <path {...common} d="M12 5v14M5 12h14" />}
      {name === 'minus' && <path {...common} d="M5 12h14" />}
      {name === 'takeoff' && (
        <>
          <path {...common} d="M12 19V5M7 10l5-5 5 5" />
          <path {...common} d="M5 19h14" />
        </>
      )}
      {name === 'land' && (
        <>
          <path {...common} d="M12 5v14M7 14l5 5 5-5" />
          <path {...common} d="M5 19h14" />
        </>
      )}
      {name === 'alert' && (
        <>
          <path {...common} d="M12 3 22 20H2z" />
          <path {...common} d="M12 9v5M12 17h.01" />
        </>
      )}
      {name === 'arrowUp' && <path {...common} d="M12 19V5M6 11l6-6 6 6" />}
      {name === 'arrowDown' && <path {...common} d="M12 5v14M6 13l6 6 6-6" />}
      {name === 'arrowLeft' && <path {...common} d="M19 12H5M11 6l-6 6 6 6" />}
      {name === 'arrowRight' && <path {...common} d="M5 12h14M13 6l6 6-6 6" />}
      {name === 'moveForward' && (
        <>
          <path {...common} d="M12 19V6" />
          <path {...common} d="m7 11 5-5 5 5" />
          <path {...common} d="M6 21h12" />
        </>
      )}
      {name === 'moveBack' && (
        <>
          <path {...common} d="M12 5v13" />
          <path {...common} d="m7 13 5 5 5-5" />
          <path {...common} d="M6 3h12" />
        </>
      )}
      {name === 'moveLeft' && (
        <>
          <path {...common} d="M19 12H6" />
          <path {...common} d="m11 7-5 5 5 5" />
          <path {...common} d="M21 6v12" />
        </>
      )}
      {name === 'moveRight' && (
        <>
          <path {...common} d="M5 12h13" />
          <path {...common} d="m13 7 5 5-5 5" />
          <path {...common} d="M3 6v12" />
        </>
      )}
      {name === 'altitudeUp' && (
        <>
          <path {...common} d="M12 20V7" />
          <path {...common} d="m8 11 4-4 4 4" />
          <path {...common} d="M7 20h10" />
          <path {...common} d="M18 5h3M19.5 3.5v3" />
        </>
      )}
      {name === 'altitudeDown' && (
        <>
          <path {...common} d="M12 4v13" />
          <path {...common} d="m8 13 4 4 4-4" />
          <path {...common} d="M7 20h10" />
          <path {...common} d="M18 5h3" />
        </>
      )}
      {name === 'rotateLeft' && (
        <>
          <path {...common} d="M4 7v6h6" />
          <path {...common} d="M5 13a7 7 0 1 0 2-7" />
        </>
      )}
      {name === 'rotateRight' && (
        <>
          <path {...common} d="M20 7v6h-6" />
          <path {...common} d="M19 13a7 7 0 1 1-2-7" />
        </>
      )}
      {name === 'gauge' && (
        <>
          <path {...common} d="M4 14a8 8 0 1 1 16 0" />
          <path {...common} d="m12 14 4-4" />
          <path {...common} d="M6 18h12" />
        </>
      )}
      {name === 'photo' && (
        <>
          <rect {...common} x="4" y="5" width="16" height="14" rx="2" />
          <circle {...common} cx="9" cy="10" r="1.5" />
          <path {...common} d="m20 15-4-4-8 8" />
        </>
      )}
      {name === 'video' && (
        <>
          <rect {...common} x="3" y="6" width="13" height="12" rx="2" />
          <path {...common} d="m16 10 5-3v10l-5-3z" />
        </>
      )}
      {name === 'radar' && (
        <>
          <circle {...common} cx="12" cy="12" r="8" />
          <path {...common} d="M12 12 18 8M12 4v2M12 18v2M4 12h2M18 12h2" />
        </>
      )}
      {name === 'activity' && <path {...common} d="M3 12h4l2-7 4 14 2-7h6" />}
      {name === 'shield' && (
        <path {...common} d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      )}
      {name === 'thermometer' && (
        <>
          <path {...common} d="M14 14.76V5a2 2 0 0 0-4 0v9.76a4 4 0 1 0 4 0z" />
          <path {...common} d="M12 7v7" />
        </>
      )}
      {name === 'check' && <path {...common} d="m5 12 4 4 10-10" />}
      {name === 'chevronRight' && <path {...common} d="m9 6 6 6-6 6" />}
    </svg>
  )
}

function GlassPanel({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        background: 'rgba(8, 13, 24, .66)',
        border: '1px solid rgba(148, 163, 184, .2)',
        boxShadow: '0 16px 40px rgba(0,0,0,.24)',
        borderRadius: 12,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

const telemetryValue = (
  value: number | undefined,
  suffix: string,
  digits = 1,
) =>
  typeof value === 'number' && Number.isFinite(value)
    ? `${value.toFixed(digits)} ${suffix}`
    : '--'

const fmt = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

function useRenderDiagnostics(name: string) {
  const renders = useRef(0)
  renders.current += 1

  useEffect(() => {
    if (
      !import.meta.env.DEV ||
      import.meta.env.VITE_MISSION_CONTROL_PERF !== 'true'
    )
      return
    const timer = window.setInterval(() => {
      if (renders.current > 0)
        console.debug(
          `[MissionControlPerf] ${name} renders/s=${renders.current}`,
        )
      renders.current = 0
    }, 1000)
    return () => window.clearInterval(timer)
  }, [name])
}

const CameraFeed = memo(function CameraFeed({
  streamUrl,
  preflightReady,
  isOnline,
  onOnline,
  onOffline,
}: {
  streamUrl: string
  preflightReady: boolean
  isOnline: boolean
  onOnline: () => void
  onOffline: () => void
}) {
  useRenderDiagnostics('CameraFeed')
  return (
    <>
      <img
        src={streamUrl}
        alt="Live drone camera"
        onLoad={onOnline}
        onError={onOffline}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          display: 'block',
          background: '#020617',
        }}
      />
      {!isOnline && preflightReady && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'grid',
            placeItems: 'center',
            background: 'rgba(2,6,23,.72)',
          }}
        >
          <GlassPanel style={{ padding: '18px 22px', textAlign: 'center' }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: '#e5edf8',
                marginBottom: 7,
              }}
            >
              Live controller offline
            </div>
            <div style={{ fontSize: 12, color: '#94a3b8' }}>
              Start the flight controller terminal to show the camera stream.
            </div>
          </GlassPanel>
        </div>
      )}
    </>
  )
})

const MissionProgress = memo(function MissionProgress({
  progress,
}: {
  progress: number
}) {
  useRenderDiagnostics('MissionProgress')
  return (
    <>
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
          }}
        >
          <span
            style={{
              fontSize: 10,
              fontWeight: 900,
              color: '#64748b',
              letterSpacing: '.18em',
              textTransform: 'uppercase',
            }}
          >
            Mission Progress
          </span>
          <span
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-data)',
              color: '#4ade80',
              fontWeight: 800,
            }}
          >
            {progress.toFixed(1)}%
          </span>
        </div>
        <div
          style={{
            height: 5,
            borderRadius: 999,
            background: 'rgba(30,41,59,.92)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg,#16a34a,#22c55e)',
            }}
          />
        </div>
      </div>
    </>
  )
})

function useSimulationMap() {
  const [meta, setMeta] = useState<MapMeta | null>(null)

  useEffect(() => {
    let alive = true

    async function loadMap() {
      try {
        const metaRes = await fetch(
          `${env.apiBaseUrl}/simulation-viewer/simulation-map.json`,
          { cache: 'no-store' },
        )
        const metaPayload = await metaRes.json()
        if (!alive) return
        setMeta(metaPayload)
      } catch {
        if (!alive) return
        setMeta(null)
      }
    }

    void loadMap()
    return () => {
      alive = false
    }
  }, [])

  return { meta }
}

function normalizeRing(
  coordinates: number[][] | undefined,
): [number, number][] {
  if (!coordinates) return []
  const ring = coordinates
    .map((point) => [Number(point[0]), Number(point[1])] as [number, number])
    .filter(([x, y]) => Number.isFinite(x) && Number.isFinite(y))

  if (ring.length < 3) return []
  const first = ring[0]
  const last = ring[ring.length - 1]
  if (first[0] !== last[0] || first[1] !== last[1]) ring.push(first)
  return ring
}

function pointOnSegment(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const cross = (px - ax) * (by - ay) - (py - ay) * (bx - ax)
  if (Math.abs(cross) > 1e-9) return false
  return (px - ax) * (px - bx) + (py - ay) * (py - by) <= 1e-9
}

function polygonContainsPoint(
  ring: [number, number][],
  point: [number, number],
) {
  const [px, py] = point
  let inside = false
  for (let index = 0; index < ring.length - 1; index += 1) {
    const [ax, ay] = ring[index]
    const [bx, by] = ring[index + 1]
    if (pointOnSegment(px, py, ax, ay, bx, by)) return true
    if (ay > py !== by > py) {
      const xAtY = ax + ((py - ay) * (bx - ax)) / (by - ay)
      if (px < xAtY) inside = !inside
    }
  }
  return inside
}

function pointSegmentDistance(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number,
) {
  const dx = bx - ax
  const dy = by - ay
  const lengthSq = dx * dx + dy * dy
  if (lengthSq <= 0) return Math.hypot(px - ax, py - ay)
  const t = Math.max(
    0,
    Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSq),
  )
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

function pointPolygonDistance(
  ring: [number, number][],
  point: [number, number],
) {
  const [px, py] = point
  if (polygonContainsPoint(ring, point)) return 0
  return Math.min(
    ...ring.slice(0, -1).map(([ax, ay], index) => {
      const [bx, by] = ring[index + 1]
      return pointSegmentDistance(px, py, ax, ay, bx, by)
    }),
  )
}

function useRestrictedZones() {
  const [zones, setZones] = useState<RestrictedZone[]>([])

  useEffect(() => {
    let alive = true

    async function loadZones() {
      try {
        const response = await fetch(`${env.apiBaseUrl}/api/zones`, {
          cache: 'no-store',
        })
        const payload = await response.json()
        const items = Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : []
        const restricted = (items as ZonePayload[])
          .filter(
            (zone) =>
              zone.restricted ||
              restrictedZoneTypes.has(
                String(zone.zoneType ?? '').toUpperCase(),
              ),
          )
          .map((zone) => ({
            id: String(zone.id ?? zone.code ?? zone.name ?? 'restricted-zone'),
            code: String(zone.code ?? ''),
            name: String(zone.name ?? zone.code ?? 'Restricted zone'),
            coordinates: normalizeRing(zone.coordinates),
          }))
          .filter((zone) => zone.coordinates.length >= 4)
        if (alive) setZones(restricted)
      } catch {
        if (alive) setZones([])
      }
    }

    void loadZones()
    const timer = window.setInterval(loadZones, 5000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [])

  return zones
}

function formatNumber(value: number | null | undefined, digits = 1) {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(digits)
    : '--'
}

function formatTemperature(value: number | null | undefined) {
  const formatted = formatNumber(value)
  return formatted === '--' ? '--' : `${formatted} °C`
}

function evaluateGeofence(
  point: [number, number] | null,
  zones: RestrictedZone[],
): GeofenceStatus {
  if (!point) return { level: 'UNKNOWN' }

  let nearestZone: RestrictedZone | undefined
  let nearestDistance = Number.POSITIVE_INFINITY

  for (const zone of zones) {
    if (polygonContainsPoint(zone.coordinates, point)) {
      return { level: 'VIOLATION', zone, distanceM: 0 }
    }
    const distance = pointPolygonDistance(zone.coordinates, point)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearestZone = zone
    }
  }

  if (!nearestZone) return { level: 'SAFE' }
  if (nearestDistance <= dangerDistanceM)
    return { level: 'DANGER', zone: nearestZone, distanceM: nearestDistance }
  if (nearestDistance <= cautionDistanceM)
    return { level: 'CAUTION', zone: nearestZone, distanceM: nearestDistance }
  return { level: 'SAFE', zone: nearestZone, distanceM: nearestDistance }
}

function statusToSimulationPoint(
  status: ControlStatus | null,
): [number, number] | null {
  if (status?.positionNed) {
    return [
      px4HomeSimX + status.positionNed.eastM,
      px4HomeSimY + status.positionNed.northM,
    ]
  }
  if (status?.positionGazebo) {
    return [status.positionGazebo.x, status.positionGazebo.y]
  }
  return null
}

const RealMiniMap = memo(function RealMiniMap({
  status,
  mission,
}: {
  status: ControlStatus | null
  mission: Mission
}) {
  useRenderDiagnostics('MiniMap')
  const { meta } = useSimulationMap()
  const [zoom, setZoom] = useState(1)
  const [follow, setFollow] = useState(false)
  const width = 320
  const height = 190

  const worldToMinimap = (x: number, y: number) => {
    if (!meta) return [width / 2, height / 2] as const
    const px = ((x - meta.minX) / (meta.maxX - meta.minX)) * width
    const py = height - ((y - meta.minY) / (meta.maxY - meta.minY)) * height
    return [px, py] as const
  }

  const simPoint = statusToSimulationPoint(status)
  const droneWorld = simPoint
    ? { x: simPoint[0], y: simPoint[1] }
    : { x: 0, y: 0 }
  const [droneX, droneY] = worldToMinimap(droneWorld.x, droneWorld.y)
  const routePoints = mission.routePoints ?? []
  const routeScreenPoints = routePoints.map((point) => {
    const [x, y] = worldToMinimap(point.simX, point.simY)
    return { ...point, x, y }
  })
  const routePath = routeScreenPoints
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x} ${point.y}`)
    .join(' ')
  const routeTargetPoint =
    routeScreenPoints.find(
      (point) => point.reason?.toUpperCase() === 'TARGET',
    ) ?? routeScreenPoints[routeScreenPoints.length - 1]
  const orderTargetPoint =
    typeof mission.targetSimX === 'number' &&
    typeof mission.targetSimY === 'number'
      ? (() => {
          const [x, y] = worldToMinimap(mission.targetSimX, mission.targetSimY)
          return { x, y }
        })()
      : null
  const missionTargetPoint = routeTargetPoint ?? orderTargetPoint
  const viewWidth = width / zoom
  const viewHeight = height / zoom
  const viewX = follow
    ? Math.max(0, Math.min(width - viewWidth, droneX - viewWidth / 2))
    : (width - viewWidth) / 2
  const viewY = follow
    ? Math.max(0, Math.min(height - viewHeight, droneY - viewHeight / 2))
    : (height - viewHeight) / 2
  const yaw = status?.yawDeg ?? 0
  const mapImagePath =
    meta?.image ?? '/simulation-viewer/simulation_map_top.png'
  const mapImageVersion = meta?.imageVersion
    ? `?v=${encodeURIComponent(meta.imageVersion)}`
    : ''
  const mapImageUrl = `${env.apiBaseUrl}${mapImagePath}${mapImageVersion}`

  return (
    <GlassPanel style={{ width: '100%', overflow: 'hidden', flexShrink: 0 }}>
      <div
        style={{
          height: 34,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          borderBottom: '1px solid rgba(148,163,184,.16)',
          color: '#cbd5e1',
          fontSize: 12,
          fontWeight: 900,
        }}
      >
        <button
          onClick={() => setFollow((value) => !value)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            border: 0,
            background: 'transparent',
            color: follow ? '#93c5fd' : '#cbd5e1',
            fontSize: 11,
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <Icon name="map" size={14} /> Mission Map
        </button>
        <span style={{ display: 'flex', gap: 5 }}>
          <button
            onClick={() =>
              setZoom((value) => Math.max(1, Number((value - 0.25).toFixed(2))))
            }
            style={{
              border: 0,
              background: 'transparent',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
            title="Zoom out"
          >
            <Icon name="minus" size={12} />
          </button>
          <button
            onClick={() =>
              setZoom((value) => Math.min(3, Number((value + 0.25).toFixed(2))))
            }
            style={{
              border: 0,
              background: 'transparent',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
            }}
            title="Zoom in"
          >
            <Icon name="plus" size={12} />
          </button>
        </span>
      </div>
      <svg
        className="mission-control-map"
        viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ display: 'block', background: 'rgba(15,23,42,.55)' }}
      >
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="rgba(15,23,42,.55)"
        />
        <image
          href={mapImageUrl}
          x="0"
          y="0"
          width={width}
          height={height}
          preserveAspectRatio="xMidYMid slice"
          opacity=".92"
        />
        <rect
          x="0"
          y="0"
          width={width}
          height={height}
          fill="rgba(2,6,23,.14)"
        />
        {routeScreenPoints.length > 1 && (
          <path
            d={routePath}
            fill="none"
            stroke="rgba(34,211,238,.92)"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="5 3"
          />
        )}
        {routeScreenPoints.map((point) => {
          const isTarget = point.reason?.toUpperCase() === 'TARGET'
          return (
            <g key={point.id} transform={`translate(${point.x} ${point.y})`}>
              <circle
                r={isTarget ? 5 : 4}
                fill={isTarget ? '#ef4444' : '#fbbf24'}
                stroke="#fff7ed"
                strokeWidth="1"
              />
              <text
                x={7}
                y={3}
                fill="#fef3c7"
                fontSize="7"
                fontWeight="900"
              >
                {point.sequence}
              </text>
            </g>
          )
        })}
        {missionTargetPoint && (
          <g transform={`translate(${missionTargetPoint.x} ${missionTargetPoint.y})`}>
            <circle
              r="13"
              fill="rgba(239,68,68,.22)"
              stroke="rgba(254,202,202,.85)"
              strokeWidth="1.5"
            />
            <circle
              r="6"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <path
              d="M0 -19 L4 -10 L-4 -10 Z"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="1"
            />
            <text
              x="10"
              y="-10"
              fill="#fee2e2"
              fontSize="8"
              fontWeight="900"
              paintOrder="stroke"
              stroke="rgba(15,23,42,.9)"
              strokeWidth="2"
            >
              ORDER
            </text>
          </g>
        )}
        <g transform={`translate(${droneX} ${droneY}) rotate(${yaw})`}>
          <circle
            cx="0"
            cy="0"
            r="8"
            fill="rgba(96,165,250,.24)"
            stroke="rgba(191,219,254,.8)"
            strokeWidth="1"
          />
          <path
            d="M0 -9 L6 7 L0 4 L-6 7 Z"
            fill="#60a5fa"
            stroke="#eff6ff"
            strokeWidth="1"
          />
        </g>
        <text
          x={viewX + 8 / zoom}
          y={viewY + 13 / zoom}
          fill="#e5edf8"
          fontSize={9 / zoom}
          fontWeight="800"
        >
          N
        </text>
        <path
          d={`M${viewX + 10 / zoom} ${viewY + 24 / zoom}v-8`}
          stroke="#e5edf8"
          strokeWidth={1.5 / zoom}
          strokeLinecap="round"
        />
      </svg>
    </GlassPanel>
  )
})

const TelemetryPanel = memo(function TelemetryPanel({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('TelemetryPanel')
  const telemetryBattery =
    typeof status?.batteryPercent === 'number' &&
    Number.isFinite(status.batteryPercent)
      ? Math.max(0, Math.min(100, status.batteryPercent))
      : null
  const batteryDisplay =
    telemetryBattery === null ? '--' : `${telemetryBattery.toFixed(1)}%`
  const batteryState = status?.batteryState ?? 'NORMAL'
  const batteryMode = status?.batteryDrainMode ?? 'LANDED'
  const droneState =
    batteryMode === 'LANDED' || batteryMode === 'IDLE' ? 'LANDED' : 'IN FLIGHT'
  const batteryTone =
    batteryState === 'EMERGENCY'
      ? '#ef4444'
      : batteryState === 'CRITICAL'
        ? '#f87171'
        : batteryState === 'LOW'
          ? '#fbbf24'
          : '#22c55e'
  return (
    <GlassPanel
      style={{
        width: '100%',
        height: 'auto',
        minHeight: 'fit-content',
        flexShrink: 0,
        overflow: 'hidden',
        padding: 10,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 950,
            color: '#cbd5e1',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          Live Telemetry
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: status?.online === false ? '#fca5a5' : '#93c5fd',
            fontSize: 10,
            fontWeight: 900,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: status?.online === false ? '#ef4444' : '#38bdf8',
            }}
          />
          {status?.online === false ? 'Offline' : 'MAVLink Live'}
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
          gap: 6,
        }}
      >
        {[
          ['Altitude', telemetryValue(status?.altitudeM, 'm')],
          ['Speed', telemetryValue(status?.speedMps, 'm/s')],
          ['Battery', batteryDisplay],
          ['State', droneState],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              minWidth: 0,
              padding: '7px 9px',
              borderRadius: 8,
              background: 'rgba(15,23,42,.54)',
              border: '1px solid rgba(148,163,184,.14)',
            }}
          >
            <div style={{ color: '#94a3b8', fontSize: 11, fontWeight: 750 }}>
              {label}
            </div>
            <strong
              style={{
                display: 'block',
                marginTop: 4,
                fontFamily: 'var(--font-data)',
                fontSize: 16,
                lineHeight: 1,
                color: '#e5edf8',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {value}
            </strong>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 8, display: 'grid', gap: 4 }}>
        {[
          ['Drain mode', batteryMode],
          ['Position', status?.positionReady ? 'Ready' : 'Waiting'],
        ].map(([label, value]) => (
          <div
            key={label}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{label}</span>
            <strong
              style={{
                fontFamily: 'var(--font-data)',
                fontSize: 11,
                color: '#cbd5e1',
                textAlign: 'right',
              }}
            >
              {value}
            </strong>
          </div>
        ))}
      </div>
      <div
        style={{
          marginTop: 7,
          height: 5,
          borderRadius: 999,
          background: 'rgba(30,41,59,.95)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${telemetryBattery ?? 0}%`,
            height: '100%',
            borderRadius: 999,
            background: batteryTone,
            transition: 'width .35s ease, background .2s ease',
          }}
        />
      </div>
    </GlassPanel>
  )
})

const AirPressurePanel = memo(function AirPressurePanel({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('AirPressurePanel')
  const altitudeM =
    typeof status?.altitudeM === 'number' && Number.isFinite(status.altitudeM)
      ? Math.max(0, status.altitudeM)
      : null
  const directPressure =
    typeof status?.airPressurePa === 'number' &&
    Number.isFinite(status.airPressurePa)
      ? status.airPressurePa
      : typeof status?.pressurePa === 'number' &&
          Number.isFinite(status.pressurePa)
        ? status.pressurePa
        : null
  const pressurePa =
    directPressure ?? (altitudeM === null ? null : pressureFromAltitude(altitudeM))
  const pressureDisplay =
    pressurePa === null ? '--' : `${Math.round(pressurePa).toLocaleString()} Pa`
  const pressureKpa =
    pressurePa === null ? '--' : `${(pressurePa / 1000).toFixed(2)} kPa`
  const altitudeDisplay =
    altitudeM === null ? '--' : `${altitudeM.toFixed(1)} m`
  const deltaDisplay =
    pressurePa === null
      ? '--'
      : `${Math.round(pressurePa - standardPressurePa).toLocaleString()} Pa`
  const trend =
    pressurePa !== null && pressurePa < standardPressurePa
      ? 'Decreases with altitude'
      : 'Sea-level reference'

  return (
    <GlassPanel
      style={{
        width: '100%',
        padding: 9,
        border: '1px solid rgba(56,189,248,.28)',
        background:
          'linear-gradient(180deg, rgba(8,18,33,.88), rgba(8,13,24,.76))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 7,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            color: '#67e8f9',
            fontSize: 10,
            fontWeight: 950,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          <Icon name="gauge" size={13} />
          Air Pressure
        </span>
        <strong
          style={{
            borderRadius: 999,
            padding: '3px 8px',
            color: status?.online === false ? '#fecaca' : '#bbf7d0',
            background:
              status?.online === false
                ? 'rgba(127,29,29,.36)'
                : 'rgba(20,83,45,.34)',
            border:
              status?.online === false
                ? '1px solid rgba(248,113,113,.36)'
                : '1px solid rgba(34,197,94,.32)',
            fontSize: 10,
            fontWeight: 950,
          }}
        >
          {status?.online === false ? 'OFFLINE' : 'LIVE'}
        </strong>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.25fr .75fr',
          gap: 7,
          alignItems: 'stretch',
        }}
      >
        <div
          style={{
            borderRadius: 9,
            padding: '8px 10px',
            background: 'rgba(15,23,42,.62)',
            border: '1px solid rgba(56,189,248,.2)',
            minWidth: 0,
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 800 }}>
            Pressure
          </div>
          <strong
            style={{
              display: 'block',
              marginTop: 4,
              color: '#e0f2fe',
              fontFamily: 'var(--font-data)',
              fontSize: 16,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {pressureDisplay}
          </strong>
          <div
            style={{
              marginTop: 5,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 8,
              color: '#93c5fd',
              fontFamily: 'var(--font-data)',
              fontSize: 10,
            }}
          >
            <span>{pressureKpa}</span>
            <span>{deltaDisplay}</span>
          </div>
        </div>

        <div
          style={{
            borderRadius: 9,
            padding: '8px 9px',
            background: 'rgba(15,23,42,.5)',
            border: '1px solid rgba(148,163,184,.14)',
            minWidth: 0,
          }}
        >
          <div style={{ color: '#94a3b8', fontSize: 10, fontWeight: 800 }}>
            Altitude
          </div>
          <strong
            style={{
              display: 'block',
              marginTop: 4,
              color: '#f8fafc',
              fontFamily: 'var(--font-data)',
              fontSize: 15,
              lineHeight: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {altitudeDisplay}
          </strong>
          <div
            style={{
              marginTop: 5,
              color: '#cbd5e1',
              fontSize: 9,
              lineHeight: 1.15,
            }}
          >
            {trend}
          </div>
        </div>
      </div>
    </GlassPanel>
  )
})

function pressureFromAltitude(altitudeM: number) {
  const ratio =
    1 - (standardLapseRateKPerM * altitudeM) / standardTemperatureK
  if (ratio <= 0) return null
  return standardPressurePa * Math.pow(ratio, barometricExponent)
}

function getLidarFresh(lidar: ControlStatus['lidar']) {
  return (
    typeof lidar?.scanAgeS === 'number' &&
    Number.isFinite(lidar.scanAgeS) &&
    lidar.scanAgeS < 3
  )
}

function getLidarMetric(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `${value.toFixed(1)} m`
    : '--'
}

type LidarDirection = 'FRONT' | 'LEFT' | 'RIGHT' | 'BACK'
type LidarSeverity = 'CLEAR' | 'CAUTION' | 'DANGER' | 'UNKNOWN'

type LidarDirectionState = {
  direction: LidarDirection
  value: number | null
  severity: LidarSeverity
  display: string
}

const lidarSectorPaths: Record<LidarDirection, string> = {
  FRONT: 'M0 0 L-44 -66 A79 79 0 0 1 44 -66 Z',
  RIGHT: 'M0 0 L66 -44 A79 79 0 0 1 66 44 Z',
  BACK: 'M0 0 L44 66 A79 79 0 0 1 -44 66 Z',
  LEFT: 'M0 0 L-66 44 A79 79 0 0 1 -66 -44 Z',
}

const lidarSectorLabels: Record<
  LidarDirection,
  { x: number; y: number; anchor: 'start' | 'middle' | 'end' }
> = {
  FRONT: { x: 0, y: -92, anchor: 'middle' },
  LEFT: { x: -95, y: -4, anchor: 'end' },
  RIGHT: { x: 95, y: -4, anchor: 'start' },
  BACK: { x: 0, y: 92, anchor: 'middle' },
}

function getValidLidarDistance(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
    ? value
    : null
}

function getMinValidDistance(values: Array<number | null | undefined>) {
  const valid = values
    .map(getValidLidarDistance)
    .filter((value): value is number => value !== null)
  return valid.length > 0 ? Math.min(...valid) : null
}

function getLidarSeverity(
  distance: number | null,
  fresh: boolean,
  maxRange: number,
): LidarSeverity {
  if (!fresh || distance === null) return 'UNKNOWN'
  if (distance >= maxRange * 0.995) return 'CLEAR'
  if (distance <= dangerDistanceM) return 'DANGER'
  if (distance <= cautionDistanceM) return 'CAUTION'
  return 'CLEAR'
}

function formatLidarDistance(distance: number | null, maxRange: number) {
  if (distance === null) return '--'
  if (distance >= maxRange * 0.995) return `> ${Math.round(maxRange)} m`
  return `${distance.toFixed(1)} m`
}

function getLidarSeverityStyle(severity: LidarSeverity) {
  if (severity === 'DANGER') {
    return {
      fill: 'rgba(239,68,68,.34)',
      stroke: '#ef4444',
      text: '#fecaca',
      badgeBg: 'rgba(239,68,68,.22)',
      badgeBorder: 'rgba(248,113,113,.42)',
      icon: '#f87171',
    }
  }
  if (severity === 'CAUTION') {
    return {
      fill: 'rgba(245,158,11,.28)',
      stroke: '#f59e0b',
      text: '#fde68a',
      badgeBg: 'rgba(245,158,11,.2)',
      badgeBorder: 'rgba(251,191,36,.42)',
      icon: '#fbbf24',
    }
  }
  if (severity === 'CLEAR') {
    return {
      fill: 'rgba(34,197,94,.25)',
      stroke: '#22c55e',
      text: '#bbf7d0',
      badgeBg: 'rgba(34,197,94,.18)',
      badgeBorder: 'rgba(74,222,128,.32)',
      icon: '#22c55e',
    }
  }
  return {
    fill: 'rgba(148,163,184,.18)',
    stroke: '#94a3b8',
    text: '#cbd5e1',
    badgeBg: 'rgba(148,163,184,.14)',
    badgeBorder: 'rgba(148,163,184,.26)',
    icon: '#94a3b8',
  }
}

const LidarRadarOverlay = memo(function LidarRadarOverlay({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('LidarRadarOverlay')
  const lidar = status?.lidar
  const fresh = getLidarFresh(lidar)
  const maxRange =
    typeof lidar?.rangeMaxM === 'number' && Number.isFinite(lidar.rangeMaxM)
      ? lidar.rangeMaxM
      : 60
  const rawDirectionStates: Array<
    Omit<LidarDirectionState, 'severity' | 'display'>
  > = [
    {
      direction: 'FRONT',
      value: getMinValidDistance([
        lidar?.frontM,
        lidar?.frontLeftM,
        lidar?.frontRightM,
      ]),
    },
    {
      direction: 'LEFT',
      value: getMinValidDistance([lidar?.leftM]),
    },
    {
      direction: 'RIGHT',
      value: getMinValidDistance([lidar?.rightM]),
    },
    {
      direction: 'BACK',
      value: getMinValidDistance([lidar?.backM]),
    },
  ]
  const directionStates: LidarDirectionState[] = rawDirectionStates.map((item) => {
    const severity = getLidarSeverity(item.value, fresh, maxRange)
    return {
      ...item,
      severity,
      display: formatLidarDistance(item.value, maxRange),
    }
  })
  const orderedSeverities: LidarSeverity[] = [
    'DANGER',
    'CAUTION',
    'UNKNOWN',
    'CLEAR',
  ]
  const panelSeverity = fresh
    ? orderedSeverities.find((severity) =>
        directionStates.some((item) => item.severity === severity),
      ) ?? 'UNKNOWN'
    : 'UNKNOWN'
  const statusLabel = fresh
    ? panelSeverity === 'DANGER'
      ? 'DANGER'
      : panelSeverity === 'CAUTION'
        ? 'CAUTION'
        : panelSeverity === 'CLEAR'
          ? 'ACTIVE'
          : 'UNKNOWN'
    : 'STALE'
  const nearestObstacle = directionStates
    .filter(
      (item) =>
        item.value !== null &&
        item.severity !== 'UNKNOWN' &&
        item.value < maxRange * 0.995,
    )
    .sort((a, b) => Number(a.value) - Number(b.value))[0]
  const alertStyle = getLidarSeverityStyle(
    !fresh ? 'UNKNOWN' : nearestObstacle?.severity ?? 'CLEAR',
  )
  const panelBorder = getLidarSeverityStyle(panelSeverity)

  return (
    <GlassPanel
      style={{
        width: '100%',
        minWidth: 0,
        alignSelf: 'start',
        padding: 0,
        overflow: 'hidden',
        border: `1px solid ${panelBorder.badgeBorder}`,
        background:
          'linear-gradient(180deg, rgba(8,18,33,.9), rgba(8,13,24,.78))',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          height: 36,
          padding: '0 9px',
          borderBottom: '1px solid rgba(148,163,184,.16)',
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            color: '#67e8f9',
            fontSize: 10,
            fontWeight: 950,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          <Icon name="radar" size={15} />
          LIDAR
        </span>
        <div
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
          }}
        >
          <strong
            style={{
              borderRadius: 999,
              padding: '3px 8px',
              background: panelBorder.badgeBg,
              border: `1px solid ${panelBorder.badgeBorder}`,
              color: panelBorder.text,
              fontSize: 11,
              fontWeight: 950,
            }}
          >
            {statusLabel}
          </strong>
          <span style={{ color: '#cbd5e1', fontSize: 9 }}>Range</span>
          <strong
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              borderRadius: 8,
              padding: '5px 7px',
              color: '#e5edf8',
              background: 'rgba(15,23,42,.58)',
              border: '1px solid rgba(148,163,184,.14)',
              fontFamily: 'var(--font-data)',
              fontSize: 12,
              fontWeight: 950,
            }}
          >
            {maxRange.toFixed(0)} m
            <Icon name="chevronRight" size={12} />
          </strong>
        </div>
      </div>
      <div
        style={{
          position: 'relative',
          display: 'grid',
          placeItems: 'center',
          padding: '4px 8px 2px',
        }}
      >
        <svg
          viewBox="-128 -118 256 236"
          width="100%"
          height="clamp(124px, 17vh, 152px)"
          preserveAspectRatio="xMidYMid meet"
          style={{ maxWidth: 204 }}
        >
          <circle r="89" fill="rgba(2,6,23,.36)" />
          {[29, 55, 82].map((r) => (
            <circle
              key={r}
              r={r}
              fill="none"
              stroke="rgba(203,213,225,.16)"
              strokeWidth="1"
            />
          ))}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const a = ((deg - 90) * Math.PI) / 180
            return (
              <line
                key={deg}
                x1={Math.cos(a) * 18}
                y1={Math.sin(a) * 18}
                x2={Math.cos(a) * 88}
                y2={Math.sin(a) * 88}
                stroke="rgba(203,213,225,.12)"
              />
            )
          })}
          {directionStates.map((item) => {
            const style = getLidarSeverityStyle(item.severity)
            const label = lidarSectorLabels[item.direction]
            return (
              <g key={item.direction}>
                <path
                  d={lidarSectorPaths[item.direction]}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth={item.severity === 'UNKNOWN' ? 1 : 1.6}
                />
                <text
                  x={label.x}
                  y={label.y}
                  textAnchor={label.anchor}
                  fill="#e5edf8"
                  fontSize="9"
                  fontWeight="950"
                >
                  {item.direction}
                </text>
                <text
                  x={label.x}
                  y={label.y + 16}
                  textAnchor={label.anchor}
                  fill="#f8fafc"
                  fontSize="12"
                  fontWeight="950"
                  fontFamily="var(--font-data)"
                >
                  {item.display}
                </text>
                <text
                  x={label.x}
                  y={label.y + 31}
                  textAnchor={label.anchor}
                  fill={style.text}
                  fontSize="8"
                  fontWeight="950"
                >
                  {item.severity}
                </text>
              </g>
            )
          })}
          <circle r="20" fill="rgba(15,23,42,.88)" stroke="#334155" />
          <circle r="10" fill="rgba(96,165,250,.2)" stroke="#bfdbfe" />
          <path
            d="M0 -18 L10 9 L0 4 L-10 9 Z"
            fill="#60a5fa"
            stroke="#eff6ff"
            strokeWidth="1.2"
          />
          <g opacity=".85">
            <circle cx="-14" cy="-2" r="3" fill="#e2e8f0" />
            <circle cx="14" cy="-2" r="3" fill="#e2e8f0" />
            <circle cx="-8" cy="9" r="3" fill="#e2e8f0" />
            <circle cx="8" cy="9" r="3" fill="#e2e8f0" />
            <path
              d="M-14 -2H14M-8 9H8"
              stroke="#e2e8f0"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 5,
          padding: '0 8px 6px',
        }}
      >
        {directionStates.map((item) => {
          const style = getLidarSeverityStyle(item.severity)
          return (
            <div
              key={item.direction}
              style={{
                borderRadius: 9,
                padding: '6px 6px',
                background: 'rgba(15,23,42,.62)',
                border: `1px solid ${style.badgeBorder}`,
              }}
            >
              <div
                style={{
                  color: '#dbeafe',
                  fontSize: 8,
                  fontWeight: 950,
                  marginBottom: 2,
                }}
              >
                {item.direction}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 4,
                }}
              >
                <strong
                  style={{
                    color: '#e5edf8',
                    fontFamily: 'var(--font-data)',
                    fontSize: 10,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {item.display}
                </strong>
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    display: 'grid',
                    placeItems: 'center',
                    color: style.icon,
                    background: style.badgeBg,
                    border: `1px solid ${style.badgeBorder}`,
                  }}
                  title={item.severity}
                >
                  {item.severity === 'CLEAR' ? (
                    <Icon name="shield" size={11} />
                  ) : item.severity === 'UNKNOWN' ? (
                    <Icon name="minus" size={10} />
                  ) : (
                    <Icon name="alert" size={11} />
                  )}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div style={{ padding: '0 9px 9px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderRadius: 10,
            padding: '8px 9px',
            background: alertStyle.badgeBg,
            border: `1px solid ${alertStyle.badgeBorder}`,
          }}
        >
          <span
            style={{
              width: 23,
              height: 23,
              borderRadius: 999,
              display: 'grid',
              placeItems: 'center',
              color: alertStyle.icon,
              background: 'rgba(2,6,23,.26)',
            }}
          >
            {!fresh || !lidar?.available ? (
              <Icon name="minus" size={14} />
            ) : nearestObstacle ? (
              <Icon
                name={
                  nearestObstacle.severity === 'CLEAR' ? 'shield' : 'alert'
                }
                size={15}
              />
            ) : (
              <Icon name="shield" size={15} />
            )}
          </span>
          <div
            style={{
              display: 'grid',
              gap: 2,
              minWidth: 0,
            }}
          >
            <strong style={{ color: '#f8fafc', fontSize: 10, lineHeight: 1.15 }}>
              {!fresh || !lidar?.available
                ? fresh
                  ? 'LiDAR data unavailable'
                  : 'LiDAR data stale'
                : nearestObstacle
                  ? `Nearest obstacle: ${nearestObstacle.display} at ${nearestObstacle.direction.toLowerCase()}`
                  : 'No obstacle within safety threshold'}
            </strong>
            <span style={{ color: '#cbd5e1', fontSize: 8, lineHeight: 1.15 }}>
              {nearestObstacle?.severity === 'DANGER'
                ? 'Hold position or avoid immediately.'
                : nearestObstacle?.severity === 'CAUTION'
                  ? 'Proceed with caution.'
                  : 'Directional sectors are clear or outside warning range.'}
            </span>
          </div>
        </div>
      </div>
    </GlassPanel>
  )
})

const LidarDetailPanel = memo(function LidarDetailPanel({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('LidarDetailPanel')
  const lidar = status?.lidar
  const fresh = getLidarFresh(lidar)
  const rows = [
    ['Status', fresh ? (lidar?.status ?? 'CLEAR') : 'WAITING'],
    ['Action', lidar?.status === 'OBSTACLE' ? 'AVOID' : 'CONTINUE'],
    ['Front', getLidarMetric(lidar?.frontM)],
    ['Front L', getLidarMetric(lidar?.frontLeftM)],
    ['Front R', getLidarMetric(lidar?.frontRightM)],
    ['Left', getLidarMetric(lidar?.leftM)],
    ['Right', getLidarMetric(lidar?.rightM)],
    ['Back', getLidarMetric(lidar?.backM)],
    ['Nearest', getLidarMetric(lidar?.nearestM)],
    ['Direction', lidar?.nearestDirection ?? lidar?.direction ?? '--'],
    ['Range', getLidarMetric(lidar?.rangeMaxM)],
    ['Scan age', lidar?.scanAgeS != null ? `${lidar.scanAgeS.toFixed(1)}s` : '--'],
  ]

  return (
    <GlassPanel
      style={{
        width: '100%',
        padding: 12,
        border: fresh
          ? '1px solid rgba(34,211,238,.28)'
          : '1px solid rgba(251,191,36,.35)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            color: fresh ? '#67e8f9' : '#fbbf24',
            fontSize: 12,
            fontWeight: 950,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          <Icon name="radar" size={14} />
          LiDAR Detail
        </span>
        <strong style={{ color: fresh ? '#bbf7d0' : '#fde68a', fontSize: 10 }}>
          {lidar?.enabled ? 'ON' : 'OFF'}
        </strong>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 7 }}>
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{label}</span>
            <strong
              style={{
                color: '#e5edf8',
                fontSize: 11,
                fontFamily: 'var(--font-data)',
                textAlign: 'right',
              }}
            >
              {value}
            </strong>
          </Fragment>
        ))}
      </div>
    </GlassPanel>
  )
})

const MissionInfoPanel = memo(function MissionInfoPanel({
  status,
  progress,
  mission,
}: {
  status: ControlStatus | null
  progress: number
  mission: Mission
}) {
  useRenderDiagnostics('MissionInfo')
  const yaw =
    typeof status?.yawDeg === 'number' && Number.isFinite(status.yawDeg)
      ? `${Math.round(status.yawDeg)}°`
      : '--'
  const distance =
    typeof mission.distanceKm === 'number' &&
    Number.isFinite(mission.distanceKm)
      ? `${mission.distanceKm.toFixed(1)} km`
      : '--'
  const routePointCount = mission.routePoints?.length ?? 0
  const routePoints = (mission.routePoints ?? [])
    .slice()
    .sort((a, b) => a.sequence - b.sequence)

  return (
    <GlassPanel
      style={{
        width: '100%',
        height: 'auto',
        minHeight: 'fit-content',
        flexShrink: 0,
        overflow: 'hidden',
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 950,
          color: '#cbd5e1',
          marginBottom: 8,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
        }}
      >
        Mission Info
      </div>
      {[
        ['Mission', mission.id],
        ['Order', mission.orderRef],
        ['Progress', `${progress.toFixed(1)}%`],
        ['Distance', distance],
        ['Points', routePointCount > 0 ? `${routePointCount}` : '--'],
        ['Max Alt', `${mission.maxAltitudeM.toFixed(0)} m`],
        ['Heading', yaw],
        [
          'Auto',
          status?.autoPlan?.active
            ? `WP ${status.autoPlan.currentIndex ?? 0}/${status.autoPlan.total ?? routePointCount}`
            : status?.autoPlan?.status ?? 'Manual',
        ],
      ].map(([label, value]) => (
        <div
          key={label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 4,
          }}
        >
          <span style={{ color: '#94a3b8', fontSize: 11 }}>{label}</span>
          <strong
            style={{
              minWidth: 0,
              color: '#e5edf8',
              fontSize: 12,
              fontFamily:
                label === 'Progress' ||
                label === 'Distance' ||
                label === 'Heading'
                  ? 'var(--font-data)'
                  : 'var(--font-ui)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'right',
            }}
          >
            {value}
          </strong>
        </div>
      ))}
      <FlightPlanGuide routePoints={routePoints} />
    </GlassPanel>
  )
})

function planReasonLabel(point: MissionRoutePoint) {
  const reason = point.reason.toUpperCase()
  if (reason === 'START') return 'Start'
  if (reason === 'TARGET') return 'Order'
  if (reason === 'TARGET_APPROACH') return 'Approach'
  if (reason === 'TERRAIN_CLEARANCE') return 'Clear'
  if (reason === 'RETURN') return 'Return'
  return 'Cruise'
}

function planSpeedLabel(point: MissionRoutePoint) {
  return typeof point.speedMps === 'number' && Number.isFinite(point.speedMps)
    ? `${point.speedMps.toFixed(1)} m/s`
    : '--'
}

function planHeadingLabel(
  point: MissionRoutePoint,
  nextPoint: MissionRoutePoint | undefined,
) {
  if (!nextPoint) return 'Hold'
  const dx = nextPoint.simX - point.simX
  const dy = nextPoint.simY - point.simY
  if (Math.hypot(dx, dy) < 0.001) return 'Hold'
  const headingDeg = (Math.atan2(dx, dy) * 180) / Math.PI
  return `${Math.round((headingDeg + 360) % 360)}°`
}

function FlightPlanGuide({ routePoints }: { routePoints: MissionRoutePoint[] }) {
  if (routePoints.length === 0) return null

  return (
    <div
      style={{
        marginTop: 10,
        paddingTop: 9,
        borderTop: '1px solid rgba(148,163,184,.18)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          marginBottom: 7,
        }}
      >
        <span
          style={{
            color: '#cbd5e1',
            fontSize: 11,
            fontWeight: 900,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          Waypoint Guide
        </span>
        <strong
          style={{
            color: '#67e8f9',
            fontSize: 10,
            fontFamily: 'var(--font-data)',
          }}
        >
          HDG / ALT / SPD
        </strong>
      </div>
      <div style={{ display: 'grid', gap: 5 }}>
        {routePoints.map((point, index) => (
          <div
            key={point.id}
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr auto',
              alignItems: 'center',
              gap: 7,
              minHeight: 28,
              padding: '5px 7px',
              border: '1px solid rgba(148,163,184,.16)',
              borderRadius: 7,
              background: 'rgba(15,23,42,.42)',
            }}
          >
            <strong
              style={{
                color: '#f8fafc',
                fontSize: 11,
                fontFamily: 'var(--font-data)',
              }}
            >
              {point.sequence}
            </strong>
            <span
              style={{
                minWidth: 0,
                color: '#cbd5e1',
                fontSize: 11,
                fontWeight: 800,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {planReasonLabel(point)}
            </span>
            <span
              style={{
                color: '#e5edf8',
                fontSize: 10,
                fontFamily: 'var(--font-data)',
                textAlign: 'right',
                whiteSpace: 'nowrap',
              }}
            >
              {planHeadingLabel(point, routePoints[index + 1])} /{' '}
              {point.altitudeM.toFixed(0)}m / {planSpeedLabel(point)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const CameraStatusPanel = memo(function CameraStatusPanel({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('CameraStatusPanel')
  const thermalEnabled = status?.thermalEnabled === true
  const cameraMode = status?.cameraMode === 'DOWN' ? 'DOWN' : 'FRONT'
  const cameraPitch = Number.isFinite(status?.cameraPitchDeg)
    ? Number(status?.cameraPitchDeg)
    : cameraMode === 'DOWN'
      ? -90
      : 0
  const cameraLabel = thermalEnabled
    ? 'Thermal'
    : cameraPitch <= -89.5
      ? 'Downward'
      : cameraPitch >= -0.5
        ? 'FPV'
        : 'Gimbal'
  const viewLabel = thermalEnabled
    ? 'Heat Map'
    : `${cameraPitch.toFixed(0)}° pitch`

  return (
    <GlassPanel
      style={{
        position: 'absolute',
        left: 22,
        top: 22,
        width: 176,
        padding: 14,
      }}
    >
      {[
        ['camera', 'Camera', cameraLabel],
        ['eye', 'View', viewLabel],
        ['joystick', 'Mode', 'Manual'],
      ].map(([icon, label, value]) => (
        <div
          key={label}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            marginBottom: label === 'Mode' ? 0 : 12,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: '#cbd5e1',
              fontSize: 12,
            }}
          >
            <Icon name={icon as IconName} size={15} />
            {label}
          </span>
          <strong style={{ color: '#4ade80', fontSize: 12 }}>{value}</strong>
        </div>
      ))}
    </GlassPanel>
  )
})

const buttonStyle = (tone?: 'danger' | 'amber'): CSSProperties => ({
  width: 46,
  height: 36,
  borderRadius: 8,
  border:
    tone === 'danger'
      ? '1px solid rgba(248,113,113,.72)'
      : '1px solid rgba(148,163,184,.18)',
  background:
    tone === 'danger'
      ? 'rgba(127,29,29,.78)'
      : tone === 'amber'
        ? 'rgba(180,83,9,.76)'
        : 'rgba(15,23,42,.78)',
  color: tone === 'danger' ? '#fecaca' : '#e5edf8',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 1,
  fontSize: 8,
  fontWeight: 800,
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,.06)',
})

const toolbarGroupStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  padding: 3,
  borderRadius: 10,
  background: 'rgba(15, 23, 42, .42)',
  border: '1px solid rgba(148,163,184,.12)',
}

const FlightControls = memo(function FlightControls({
  busyCommand,
  lidarDetailsOpen,
  moreOpen,
  status,
  onCommand,
  onWeatherPreset,
  onToggleMore,
  onCompleteMission,
}: {
  busyCommand: FlightCommand | null
  lidarDetailsOpen: boolean
  moreOpen: boolean
  status: ControlStatus | null
  onCommand: (command: FlightCommand) => void
  onWeatherPreset: (preset: WeatherPreset) => void
  onToggleMore: () => void
  onCompleteMission?: () => void
}) {
  useRenderDiagnostics('FlightControls')
  const thermalEnabled = status?.thermalEnabled === true
  const thermalLabel = `Thermal ${thermalEnabled ? 'ON' : 'OFF'}`
  const controlButton = (item: {
    command: FlightCommand
    label: string
    icon: IconName
    tone?: 'danger' | 'amber'
  }) => {
    const isThermal = item.command === 'thermal_toggle'
    const isLidar = item.command === 'lidar_monitor_toggle'
    const label = isThermal
      ? `Thermal ${thermalEnabled ? 'ON' : 'OFF'}`
      : isLidar
        ? `LiDAR ${lidarDetailsOpen ? 'VIEW' : 'UI'}`
      : item.label
    return (
      <button
        key={`${item.command}-${item.label}`}
        onClick={() => onCommand(item.command)}
        disabled={busyCommand !== null}
        style={{
          ...buttonStyle(
            (isThermal && thermalEnabled) || (isLidar && lidarDetailsOpen)
              ? 'amber'
              : item.tone,
          ),
        }}
        title={label}
      >
        <Icon name={item.icon} size={14} />
        <span>{busyCommand === item.command ? 'Sending' : label}</span>
      </button>
    )
  }

  return (
    <GlassPanel
      style={{
        display: 'grid',
        gridTemplateColumns:
          'minmax(220px, .8fr) minmax(340px, 1.25fr) minmax(280px, 1fr)',
        alignItems: 'stretch',
        gap: 8,
        padding: 8,
        width: '100%',
        overflow: 'visible',
      }}
    >
      <div style={{ ...toolbarGroupStyle, alignContent: 'center' }}>
        <div
          style={{
            width: '100%',
            color: '#94a3b8',
            fontSize: 10,
            fontWeight: 850,
            marginBottom: 2,
          }}
        >
          Quick Actions
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 4 }}>
          {flightControls.map(controlButton)}
          <button
            onClick={() => onCommand('stop')}
            disabled={busyCommand !== null}
            style={{
              ...buttonStyle(),
              background: 'rgba(20,83,45,.82)',
              color: '#86efac',
            }}
            title="Hover"
          >
            <Icon name="joystick" size={14} />
            <span>Hover</span>
          </button>
          {onCompleteMission && (
            <button
              onClick={onCompleteMission}
              disabled={busyCommand !== null}
              style={{
                ...buttonStyle(),
                background: 'rgba(22,101,52,.88)',
                color: '#bbf7d0',
                width: 70,
              }}
              title="Complete mission"
            >
              <Icon name="check" size={14} />
              <span>Complete</span>
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          ...toolbarGroupStyle,
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 46px)',
          alignContent: 'center',
          gap: 4,
        }}
      >
        <div
          style={{
            gridColumn: '1 / -1',
            color: '#94a3b8',
            fontSize: 10,
            fontWeight: 850,
            marginBottom: 1,
          }}
        >
          Manual Control
        </div>
        {movementControls.map((item) => (
          <button
            key={item.label}
            onClick={() => onCommand(item.command)}
            disabled={busyCommand !== null}
            style={{
              width: 46,
              height: 29,
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,.18)',
              background: 'rgba(15,23,42,.78)',
              color: '#e5edf8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              cursor: 'pointer',
              fontSize: 7,
              fontWeight: 850,
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,.05)',
            }}
            title={item.label}
          >
            <Icon name={item.icon} size={12} />
            <span>{item.label}</span>
          </button>
        ))}
        {rotationControls.map((item) => (
          <button
            key={item.label}
            onClick={() => onCommand(item.command)}
            disabled={busyCommand !== null}
            style={{
              ...buttonStyle(),
              width: 46,
              height: 29,
              fontSize: 7,
            }}
            title={item.label}
          >
            <Icon name={item.icon} size={12} />
            <span>{busyCommand === item.command ? 'Sending' : item.label}</span>
          </button>
        ))}
      </div>

      <div
        style={{
          ...toolbarGroupStyle,
          alignContent: 'center',
          position: 'relative',
        }}
      >
        <div
          style={{
            width: '100%',
            color: '#94a3b8',
            fontSize: 10,
            fontWeight: 850,
            marginBottom: 2,
          }}
        >
          Camera & Tools
        </div>
        <button
          onClick={() => onCommand('thermal_toggle')}
          disabled={busyCommand !== null}
          style={{
            ...buttonStyle(thermalEnabled ? 'amber' : undefined),
            width: 62,
          }}
          title={thermalLabel}
        >
          <Icon name="thermometer" size={14} />
          <span>
            {busyCommand === 'thermal_toggle' ? 'Sending' : thermalLabel}
          </span>
        </button>
        <button
          onClick={onToggleMore}
          disabled={busyCommand !== null}
          style={buttonStyle()}
          title="More controls"
        >
          <Icon name="chevronRight" size={14} />
          <span>More</span>
        </button>
        {moreOpen && (
          <GlassPanel
            style={{
              position: 'absolute',
              right: 0,
              bottom: 46,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 48px)',
              gap: 5,
              padding: 6,
              zIndex: 10,
            }}
          >
            {moreToolControls.map(controlButton)}
          </GlassPanel>
        )}
        <div
          style={{
            width: '100%',
            marginTop: 6,
            display: 'grid',
            gridTemplateColumns: 'repeat(6, minmax(42px, 1fr))',
            gap: 4,
          }}
        >
          {weatherControls.map((item) => (
            <button
              key={item.preset}
              onClick={() => onWeatherPreset(item.preset)}
              disabled={busyCommand !== null}
              style={{
                ...buttonStyle(item.tone),
                width: 'auto',
                height: 28,
                minWidth: 0,
                fontSize: 7,
              }}
              title={`Weather: ${item.label}`}
            >
              <Icon name="thermometer" size={11} />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </GlassPanel>
  )
})

export default function InFlightControl({
  mission,
  drone,
  onRTB,
  onEmergency,
  autoStartPlan,
  onAutoStartPlanConsumed,
  onPreflightReady,
  onCompleteMission,
}: Props) {
  const preflightStorageKey = `omss.droneOperator.preflightReady.${mission.id}.${drone.id}`
  const [elapsed, setElapsed] = useState(5)
  const [progress, setProgress] = useState(18.2)
  const [isOnline, setIsOnline] = useState(false)
  const [lastCommand, setLastCommand] = useState('Waiting for controller')
  const [busyCommand, setBusyCommand] = useState<FlightCommand | null>(null)
  const [streamRevision, setStreamRevision] = useState(0)
  const [controlStatus, setControlStatus] = useState<ControlStatus | null>(null)
  const [moreOpen, setMoreOpen] = useState(false)
  const [lidarDetailsOpen, setLidarDetailsOpen] = useState(false)
  const [preflightReady, setPreflightReady] = useState(() => {
    try {
      return window.localStorage.getItem(preflightStorageKey) === 'true'
    } catch {
      return false
    }
  })
  const restrictedZones = useRestrictedZones()

  const thermalEnabled = controlStatus?.thermalEnabled === true
  const streamUrl = useMemo(
    () =>
      `${controlBaseUrl}/${thermalEnabled ? 'thermal-stream.mjpg' : 'stream.mjpg'}?viewer=operator&v=${streamRevision}`,
    [streamRevision, thermalEnabled],
  )
  const remaining = Math.max(0, mission.estimatedMinutes * 60 - elapsed)
  const dronePoint = statusToSimulationPoint(controlStatus)
  const geofenceStatus = useMemo(
    () => evaluateGeofence(dronePoint, restrictedZones),
    [dronePoint, restrictedZones],
  )
  const geofenceAlertActive =
    geofenceStatus.level === 'CAUTION' ||
    geofenceStatus.level === 'DANGER' ||
    geofenceStatus.level === 'VIOLATION'
  const geofenceTone =
    geofenceStatus.level === 'VIOLATION' || geofenceStatus.level === 'DANGER'
      ? 'danger'
      : 'amber'
  const geofenceZoneName =
    geofenceStatus.zone?.name ?? geofenceStatus.zone?.code ?? 'restricted zone'
  const geofenceMessage =
    geofenceStatus.level === 'VIOLATION'
      ? `Restricted zone breach: ${geofenceZoneName}`
      : geofenceStatus.level === 'DANGER'
        ? `Restricted zone danger: ${Math.round(geofenceStatus.distanceM ?? 0)} m from ${geofenceZoneName}`
        : geofenceStatus.level === 'CAUTION'
          ? `Restricted zone caution: ${Math.round(geofenceStatus.distanceM ?? 0)} m from ${geofenceZoneName}`
          : 'All Systems Nominal'
  const footerStatusColor = geofenceAlertActive
    ? geofenceTone === 'danger'
      ? '#fecaca'
      : '#fde68a'
    : '#bbf7d0'
  const footerStatusDot = geofenceAlertActive
    ? geofenceTone === 'danger'
      ? '#ef4444'
      : '#f59e0b'
    : '#22c55e'

  useEffect(() => {
    try {
      setPreflightReady(
        window.localStorage.getItem(preflightStorageKey) === 'true',
      )
    } catch {
      setPreflightReady(false)
    }
  }, [preflightStorageKey])

  const clearPreflightReady = useCallback(() => {
    try {
      window.localStorage.removeItem(preflightStorageKey)
    } catch {
      // Ignore storage failures; the in-memory state still resets for this page.
    }
    setPreflightReady(false)
  }, [preflightStorageKey])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsed((value) => value + 1)
      setProgress((value) => Math.min(100, value + 0.04))
    }, 1000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let alive = true

    async function checkStatus() {
      try {
        const response = await fetch(`${controlBaseUrl}/api/control/status`, {
          cache: 'no-store',
        })
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const status = await response
          .json()
          .catch(() => ({ online: response.ok }))
        if (alive) {
          setControlStatus(status)
          setIsOnline((wasOnline) => {
            if (!wasOnline && response.ok)
              setStreamRevision((value) => value + 1)
            return response.ok
          })
        }
      } catch {
        if (alive) {
          setControlStatus(null)
          setIsOnline(false)
          clearPreflightReady()
        }
      }
    }

    void checkStatus()
    const timer = window.setInterval(checkStatus, 2500)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [clearPreflightReady])

  const sendCommand = useCallback(
    async (command: FlightCommand) => {
      if (!preflightReady) {
        setLastCommand('Preflight required')
        return
      }
      const routePoints = (mission.routePoints ?? [])
        .slice()
        .sort((a, b) => a.sequence - b.sequence)
      if (command === 'auto_plan_start' && routePoints.length === 0) {
        setLastCommand('No mission plan waypoints')
        return
      }
      setBusyCommand(command)
      try {
        const response = await fetch(`${controlBaseUrl}/api/control/command`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            command,
            ...(command === 'auto_plan_start'
              ? {
                  missionId: mission.id,
                  waypoints: routePoints.map((point) => ({
                    sequence: point.sequence,
                    simX: point.simX,
                    simY: point.simY,
                    altitudeM: point.altitudeM,
                    speedMps: point.speedMps,
                    reason: point.reason,
                  })),
                }
              : {}),
          }),
        })

        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        setLastCommand(
          command === 'auto_plan_start'
            ? `Auto plan started (${routePoints.length} points)`
            : `${command.replaceAll('_', ' ')} sent`,
        )
        setIsOnline(true)

        if (command === 'return_to_base') onRTB()
        if (command === 'emergency_stop') onEmergency()
      } catch {
        setLastCommand('Controller offline or command rejected')
        setIsOnline(false)
      } finally {
        setBusyCommand(null)
      }
    },
    [mission.id, mission.routePoints, onEmergency, onRTB, preflightReady],
  )

  useEffect(() => {
    if (!autoStartPlan) return
    if (!preflightReady) return
    if ((mission.routePoints?.length ?? 0) === 0) {
      setLastCommand('No mission plan waypoints')
      onAutoStartPlanConsumed()
      return
    }
    onAutoStartPlanConsumed()
    void sendCommand('auto_plan_start')
  }, [
    autoStartPlan,
    mission.routePoints,
    onAutoStartPlanConsumed,
    preflightReady,
    sendCommand,
  ])

  const telemetryBattery =
    typeof controlStatus?.batteryPercent === 'number' &&
    Number.isFinite(controlStatus.batteryPercent)
      ? Math.max(0, Math.min(100, controlStatus.batteryPercent))
      : null
  const batteryDisplay =
    telemetryBattery === null ? '--' : `${telemetryBattery.toFixed(1)}%`
  const batteryState = controlStatus?.batteryState ?? 'NORMAL'
  const showBatteryWarning =
    telemetryBattery !== null && batteryState !== 'NORMAL'
  const thermalMax = formatTemperature(controlStatus?.maxTemperatureC)
  const thermalRows = [
    [
      'Resolution',
      controlStatus?.thermalFrameWidth && controlStatus?.thermalFrameHeight
        ? `${controlStatus.thermalFrameWidth}x${controlStatus.thermalFrameHeight}`
        : '--',
    ],
    ['FPS', formatNumber(controlStatus?.thermalFps)],
    ['Mode', controlStatus?.thermalMode?.replaceAll('_', ' ') ?? '--'],
    [
      'Frame age',
      typeof controlStatus?.thermalFrameAgeMs === 'number'
        ? `${controlStatus.thermalFrameAgeMs} ms`
        : '--',
    ],
    ['Min', formatTemperature(controlStatus?.minTemperatureC)],
    ['Avg', formatTemperature(controlStatus?.averageTemperatureC)],
    ['Max', thermalMax],
    ['Threshold', formatTemperature(controlStatus?.thermalThresholdC)],
    ['Palette', controlStatus?.thermalPalette ?? '--'],
    ['Range', controlStatus?.thermalDisplayRangeMode ?? '--'],
    [
      'Scale',
      controlStatus?.thermalDisplayMinC != null &&
      controlStatus?.thermalDisplayMaxC != null
        ? `${formatNumber(controlStatus.thermalDisplayMinC)}-${formatNumber(controlStatus.thermalDisplayMaxC)} °C`
        : '--',
    ],
    [
      'ISO',
      `${controlStatus?.thermalIsothermEnabled ? 'ON' : 'OFF'} / DBG ${controlStatus?.thermalDebugOverlayEnabled ? 'ON' : 'OFF'}`,
    ],
  ]
  const handleOnline = useCallback(() => setIsOnline(true), [])
  const handleOffline = useCallback(() => setIsOnline(false), [])
  const handleToggleMore = useCallback(() => setMoreOpen((value) => !value), [])
  const handleCommand = useCallback(
    (command: FlightCommand) => {
      if (command === 'lidar_monitor_toggle') {
        setLidarDetailsOpen((value) => !value)
        if (controlStatus?.lidar?.enabled === true) {
          setLastCommand('LiDAR panel toggled')
          return
        }
      }
      void sendCommand(command)
    },
    [controlStatus?.lidar?.enabled, sendCommand],
  )
  const handleWeatherPreset = useCallback(async (preset: WeatherPreset) => {
    setLastCommand(`Setting weather ${preset.replaceAll('_', ' ').toLowerCase()}`)
    try {
      const response = await fetch(`${controlBaseUrl}/api/control/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'weather_set', preset }),
      })
      const payload = await response.json()
      const weather = payload.weather as
        | { status?: string; weatherLabel?: string }
        | undefined
      if (!response.ok || !weather) throw new Error(`HTTP ${response.status}`)
      const label = weather?.weatherLabel ?? preset.replaceAll('_', ' ')
      const status = weather?.status ?? 'UPDATED'
      setLastCommand(
        payload.ok === false
          ? `Weather ${label}: ${status} (visual pending)`
          : `Weather ${label}: ${status}`,
      )
      setIsOnline(true)
    } catch {
      setLastCommand('Weather controller offline')
      setIsOnline(false)
    }
  }, [])
  const handlePreflightReady = useCallback(() => {
    try {
      window.localStorage.setItem(preflightStorageKey, 'true')
    } catch {
      // Ignore storage failures; the current screen can still continue.
    }
    setPreflightReady(true)
    setLastCommand('Preflight completed')
    onPreflightReady?.()
  }, [onPreflightReady, preflightStorageKey])

  return (
    <div
      className="mission-control-root"
      style={{
        flex: 1,
        minHeight: '100vh',
        height: '100vh',
        display: 'grid',
        gridTemplateRows: '76px 1fr 42px',
        background: '#020617',
        color: '#e5edf8',
        overflow: 'hidden',
        colorScheme: 'dark',
      }}
    >
      <header
        style={{
          display: 'grid',
          gridTemplateColumns: '330px minmax(320px,1fr) 280px',
          alignItems: 'center',
          gap: 22,
          padding: '12px 22px',
          background: 'linear-gradient(180deg,#071324,#08111f)',
          borderBottom: '1px solid rgba(59,130,246,.28)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(37,99,235,.18)',
              border: '1px solid rgba(96,165,250,.3)',
              color: '#93c5fd',
            }}
          >
            <Icon name="drone" size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <strong style={{ fontSize: 14, letterSpacing: '.02em' }}>
                {drone.id}
              </strong>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '3px 8px',
                  borderRadius: 999,
                  background: 'rgba(22,163,74,.18)',
                  color: '#4ade80',
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                <span
                  className={isOnline ? 'pulse-dot' : undefined}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: isOnline ? '#22c55e' : '#ef4444',
                  }}
                />
                {isOnline ? 'LIVE' : 'OFFLINE'}
              </span>
            </div>
            <div style={{ marginTop: 2, fontSize: 12, color: '#94a3b8' }}>
              Drone Operator
            </div>
          </div>
        </div>

        <MissionProgress progress={progress} />

        <div
          style={{
            justifySelf: 'end',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <span
            style={{
              fontSize: 12,
              fontFamily: 'var(--font-data)',
              color: '#94a3b8',
            }}
          >
            {fmt(elapsed)} / {fmt(remaining)}
          </span>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              border: '1px solid rgba(148,163,184,.2)',
              background: 'rgba(15,23,42,.76)',
              color: '#cbd5e1',
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
            }}
            title="Settings"
          >
            <Icon name="settings" size={18} />
          </button>
        </div>
      </header>

      <main
        className="mission-control-workspace"
        style={{
          minHeight: 0,
          height: '100%',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns:
            'minmax(0, 1.45fr) minmax(360px, 0.74fr) minmax(280px, 0.62fr)',
          gridTemplateRows: 'minmax(350px, 1fr) auto',
          alignItems: 'stretch',
          gap: 12,
          padding: '10px 14px 10px',
          background:
            'radial-gradient(circle at 28% 10%, rgba(37, 99, 235, 0.12), transparent 34%), #020617',
        }}
      >
        <section
          className="mission-control-primary"
          style={{
            minWidth: 0,
            minHeight: 0,
            height: '100%',
            display: 'grid',
          }}
        >
          <div
            className="mission-control-camera-card"
            style={{
              position: 'relative',
              minWidth: 0,
              minHeight: 350,
              height: '100%',
              overflow: 'hidden',
              borderRadius: 10,
              border: '1px solid rgba(59, 130, 246, 0.32)',
              background: '#020617',
              boxShadow: '0 18px 45px rgba(0, 0, 0, 0.24)',
            }}
          >
            <CameraFeed
              streamUrl={streamUrl}
              preflightReady={preflightReady}
              isOnline={isOnline}
              onOnline={handleOnline}
              onOffline={handleOffline}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                pointerEvents: 'none',
                background:
                  'radial-gradient(circle at center, transparent 0 42%, rgba(2,6,23,.08) 72%, rgba(2,6,23,.34) 100%)',
              }}
            />

            <div
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: 78,
                height: 78,
                transform: 'translate(-50%,-50%)',
                color: 'rgba(226,232,240,.68)',
                pointerEvents: 'none',
              }}
            >
              <Icon name="crosshair" size={78} />
            </div>

            <CameraStatusPanel status={controlStatus} />

            {thermalEnabled && (
              <GlassPanel
                style={{
                  position: 'absolute',
                  right: 16,
                  top: 178,
                  width: 260,
                  padding: '12px 14px',
                  border: controlStatus?.hotspotDetected
                    ? '1px solid rgba(251,146,60,.78)'
                    : '1px solid rgba(56,189,248,.35)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <strong
                    style={{
                      fontSize: 12,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      color: '#e5edf8',
                    }}
                  >
                    Thermal
                  </strong>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 900,
                      color:
                        controlStatus?.thermalSensorOnline === false
                          ? '#fca5a5'
                          : '#67e8f9',
                    }}
                  >
                    {controlStatus?.thermalSensorOnline === false
                      ? 'OFFLINE'
                      : 'SENSOR ONLINE'}
                  </span>
                </div>
                <div
                  style={{
                    marginBottom: 8,
                    fontSize: 12,
                    fontWeight: 900,
                    color: controlStatus?.hotspotDetected
                      ? '#fed7aa'
                      : '#bae6fd',
                  }}
                >
                  {controlStatus?.hotspotDetected
                    ? 'HOTSPOT DETECTED'
                    : 'No hotspot'}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    rowGap: 5,
                    columnGap: 12,
                    fontSize: 11,
                    color: '#cbd5e1',
                  }}
                >
                  {thermalRows.map(([label, value]) => (
                    <Fragment key={label}>
                      <span>{label}</span>
                      <strong
                        style={{
                          color:
                            label === 'Max' && controlStatus?.hotspotDetected
                              ? '#fed7aa'
                              : '#f8fafc',
                          fontFamily: 'var(--font-data)',
                          textAlign: 'right',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {value}
                      </strong>
                    </Fragment>
                  ))}
                </div>
                {controlStatus?.thermalSourceError && (
                  <div
                    style={{
                      marginTop: 8,
                      color: '#fca5a5',
                      fontSize: 10,
                      lineHeight: 1.35,
                    }}
                  >
                    Err: {controlStatus.thermalSourceError}
                  </div>
                )}
              </GlassPanel>
            )}

            {showBatteryWarning && (
              <GlassPanel
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: geofenceAlertActive ? 92 : 20,
                  transform: 'translateX(-50%)',
                  width: 'min(360px, calc(100% - 56px))',
                  padding: '11px 14px',
                  border: `1px solid ${batteryState === 'LOW' ? 'rgba(251,191,36,.7)' : 'rgba(248,113,113,.72)'}`,
                  background:
                    batteryState === 'LOW'
                      ? 'rgba(120,53,15,.82)'
                      : 'rgba(127,29,29,.78)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="alert" size={20} />
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 950,
                        color: batteryState === 'LOW' ? '#fef3c7' : '#fee2e2',
                        textTransform: 'uppercase',
                        letterSpacing: '.08em',
                      }}
                    >
                      {batteryState === 'LOW'
                        ? 'Low battery'
                        : batteryState === 'CRITICAL'
                          ? 'Critical battery'
                          : 'Emergency battery'}{' '}
                      - {batteryDisplay}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 11,
                        color: batteryState === 'LOW' ? '#fde68a' : '#fecaca',
                        fontWeight: 750,
                      }}
                    >
                      Manual control remains available. No automatic flight
                      action was triggered.
                    </div>
                  </div>
                </div>
              </GlassPanel>
            )}

            <GlassPanel
              style={{
                position: 'absolute',
                right: 14,
                bottom: 14,
                padding: '7px 11px',
                color: '#cbd5e1',
                fontSize: 11,
              }}
            >
              {lastCommand}
            </GlassPanel>

            {geofenceAlertActive && (
              <GlassPanel
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: 20,
                  transform: 'translateX(-50%)',
                  width: 'min(460px, calc(100% - 56px))',
                  padding: '13px 16px',
                  border:
                    geofenceTone === 'danger'
                      ? '1px solid rgba(248,113,113,.72)'
                      : '1px solid rgba(251,191,36,.72)',
                  background:
                    geofenceTone === 'danger'
                      ? 'rgba(127,29,29,.78)'
                      : 'rgba(120,53,15,.82)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name="alert" size={22} />
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 950,
                        color:
                          geofenceTone === 'danger' ? '#fee2e2' : '#fef3c7',
                        textTransform: 'uppercase',
                        letterSpacing: '.08em',
                      }}
                    >
                      {geofenceStatus.level === 'VIOLATION'
                        ? 'No-fly zone breach'
                        : 'No-fly zone warning'}
                    </div>
                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 12,
                        color:
                          geofenceTone === 'danger' ? '#fecaca' : '#fde68a',
                        fontWeight: 750,
                      }}
                    >
                      {geofenceMessage}
                    </div>
                  </div>
                </div>
              </GlassPanel>
            )}
          </div>
        </section>

        <section
          className="mission-control-lidar"
          style={{
            minWidth: 0,
            minHeight: 0,
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 8,
            overflowX: 'hidden',
            overflowY: 'auto',
            paddingRight: 2,
            scrollbarGutter: 'stable',
          }}
        >
          <LidarRadarOverlay status={controlStatus} />
          <AirPressurePanel status={controlStatus} />
        </section>

        <section
          className="mission-control-controls"
          style={{
            gridColumn: '1 / 3',
            minWidth: 0,
            overflow: 'visible',
          }}
        >
          <FlightControls
            busyCommand={busyCommand}
            lidarDetailsOpen={lidarDetailsOpen}
            moreOpen={moreOpen}
            status={controlStatus}
            onCommand={handleCommand}
            onWeatherPreset={handleWeatherPreset}
            onToggleMore={handleToggleMore}
            onCompleteMission={onCompleteMission}
          />
        </section>

        <aside
          className="mission-control-side"
          style={{
            gridColumn: 3,
            gridRow: '1 / 3',
            minWidth: 0,
            minHeight: 0,
            height: '100%',
            maxHeight: '100%',
            overflowX: 'hidden',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            paddingRight: 4,
            scrollbarGutter: 'stable',
          }}
        >
          <TelemetryPanel status={controlStatus} />
          {lidarDetailsOpen && <LidarDetailPanel status={controlStatus} />}
          <MissionInfoPanel
            status={controlStatus}
            progress={progress}
            mission={mission}
          />
          <RealMiniMap status={controlStatus} mission={mission} />
        </aside>

        {!preflightReady && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 20,
              background: '#f1f5f9',
              overflow: 'auto',
              padding: 22,
            }}
          >
            <PreflightChecklistPanel
              missionId={mission.id}
              droneLabel={`${drone.id}${drone.name ? ` ${drone.name}` : ''}`}
              onReady={handlePreflightReady}
              embedded
            />
          </div>
        )}
      </main>

      <footer
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '5px 18px',
          background: '#071324',
          borderTop: '1px solid rgba(59,130,246,.24)',
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back()
              return
            }
            navigateOperator(operatorHref({ screen: 'missions' }))
          }}
          style={{
            height: 28,
            padding: '0 12px',
            borderRadius: 9,
            border: '1px solid rgba(148,163,184,.2)',
            background: 'rgba(15,23,42,.72)',
            color: '#dbeafe',
            fontSize: 12,
            fontWeight: 850,
            cursor: 'pointer',
          }}
          title="Quay lại màn trước"
        >
          ← Back
        </button>
        {[
          {
            label: 'Overview',
            href: operatorHref({ screen: 'missions' }),
          },
          {
            label: 'Missions',
            href: operatorHref({ screen: 'missions' }),
          },
          {
            label: 'Detail',
            href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
          },
          {
            label: 'GCS Connect',
            href: operatorHref({ screen: 'connect' }),
            active: true,
          },
        ].map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => navigateOperator(item.href)}
            style={{
              height: 28,
              padding: '0 12px',
              borderRadius: 9,
              border: '1px solid transparent',
              background:
                item.active ? 'rgba(37,99,235,.2)' : 'transparent',
              color: item.active ? '#bfdbfe' : '#94a3b8',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            {item.label}
          </button>
        ))}
        <div
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 7,
              color: footerStatusColor,
              fontSize: 12,
              fontWeight: 800,
            }}
          >
            <span
              className="pulse-dot"
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: footerStatusDot,
              }}
            />
            {geofenceMessage}
          </span>
          <span
            style={{
              padding: '5px 10px',
              borderRadius: 999,
              background: 'rgba(37,99,235,.22)',
              border: '1px solid rgba(96,165,250,.28)',
              color: '#bfdbfe',
              fontSize: 11,
              fontWeight: 900,
            }}
          >
            In Flight
          </span>
          {onCompleteMission && (
            <button
              onClick={onCompleteMission}
              disabled={busyCommand !== null}
              style={{
                height: 30,
                padding: '0 14px',
                borderRadius: 999,
                border: '1px solid rgba(74,222,128,.36)',
                background: 'rgba(22,101,52,.92)',
                color: '#bbf7d0',
                fontSize: 11,
                fontWeight: 950,
                cursor: busyCommand === null ? 'pointer' : 'not-allowed',
              }}
              title="Complete mission and release drone"
            >
              Complete mission
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
