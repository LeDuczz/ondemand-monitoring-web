import { useEffect, useState } from 'react'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { EmptyState, LoadingState } from '../../../shared/components/odm/StateView'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import {
  SIMULATION_MAP_DEFAULT_CROP,
  simulationMapImageStyle,
  worldToViewportPercent,
} from '../../../shared/lib/simulationMapProjection'
import { env } from '../../../config/env'
import { authenticatedFetch } from '../../auth/api/authApi'
import { operatorApi } from '../api/operatorApi'
import { setActiveMissionId } from '../api/liveMission'
import { operatorHref } from '../routes'
import type { OperatorMission, OperatorMissionPlanWaypoint } from '../types/mission'
import { RejectDialog } from './RejectDialog'

const STATUS_TONE = {
  PENDING: 'gray',
  ACCEPTED: 'green',
  IN_FLIGHT: 'blue',
  COMPLETED: 'green',
  REJECTED: 'red',
  FAILED: 'red',
} as const

const STATUS_LABEL: Record<OperatorMission['status'], string> = {
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Đã nhận',
  IN_FLIGHT: 'Đang bay',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Bị từ chối',
  FAILED: 'Không hoàn thành',
}

const SIM_RADIUS_SCALE = 6

type SimulationMapMeta = {
  image?: string
  imageVersion?: string
  minX: number
  maxX: number
  minY: number
  maxY: number
  imageBounds?: {
    minX: number
    maxX: number
    minY: number
    maxY: number
  }
}

type RuntimeStatus = 'PENDING' | 'CHECKING' | 'PASS' | 'WARN' | 'FAIL'
type RuntimeOverallStatus = 'CHECKING' | 'READY' | 'FAILED'

type RuntimeCheck = {
  key: string
  name: string
  status: RuntimeStatus
  message: string
  critical: boolean
}

type RuntimePreflightStatus = {
  checkId: string
  status: RuntimeOverallStatus
  progress: number
  checks: RuntimeCheck[]
}

type StoredPreflightStatus = {
  savedAt: number
  runtimeSessionId?: string | null
  status: RuntimePreflightStatus
}

type WeatherCheckStatus = 'PASS' | 'WARN' | 'FAIL'

type WeatherPreflightStatus = {
  id?: string
  missionId?: string
  droneCode?: string
  status: WeatherCheckStatus
  safeToFly: boolean
  summary: string
  windSpeedMps: number
  windGustMps: number
  precipitationMmH: number
  visibilityKm: number
  temperatureC: number
  humidityPercent: number
  advisories: string[]
  checkedAt: string
}

type StoredWeatherStatus = {
  savedAt: number
  status: WeatherPreflightStatus
}

type PostflightCheckStatus = {
  id: string
  missionId?: string | null
  droneCode?: string | null
  checkedBy?: string | null
  batteryOk?: boolean | null
  motorOk?: boolean | null
  cameraOk?: boolean | null
  gpsOk?: boolean | null
  communicationOk?: boolean | null
  physicalConditionOk?: boolean | null
  overallOk: boolean
  faultType?: string | null
  notes?: string | null
  landingBatteryPercent?: number | null
  landingBatteryState?: string | null
  landingAltitudeM?: number | null
  landingSpeedMps?: number | null
  landingHeadingDeg?: number | null
  landingTelemetryOnline?: boolean | null
  checkedAt: string
}

function useSimulationMapMeta() {
  const [meta, setMeta] = useState<SimulationMapMeta | null>(null)

  useEffect(() => {
    let alive = true

    async function loadMeta() {
      try {
        const response = await fetch(`${env.apiBaseUrl}/simulation-viewer/simulation-map.json`, {
          cache: 'no-store',
        })
        if (!response.ok) return
        const payload = (await response.json()) as SimulationMapMeta
        if (alive) setMeta(payload)
      } catch {
        if (alive) setMeta(null)
      }
    }

    void loadMeta()

    return () => {
      alive = false
    }
  }, [])

  return meta
}

function preflightStateStorageKey(missionId: string, droneLabel: string) {
  return `omss.droneOperator.preflightState.${missionId}.${droneLabel}`
}

function weatherStateStorageKey(missionId: string, droneLabel: string) {
  return `omss.droneOperator.weatherState.${missionId}.${droneLabel}`
}

function isRuntimeStatus(value: unknown): value is RuntimePreflightStatus {
  if (!value || typeof value !== 'object') return false
  const candidate = value as RuntimePreflightStatus
  return (
    typeof candidate.checkId === 'string' &&
    ['CHECKING', 'READY', 'FAILED'].includes(candidate.status) &&
    typeof candidate.progress === 'number' &&
    Array.isArray(candidate.checks)
  )
}

function isWeatherStatus(value: unknown): value is WeatherPreflightStatus {
  if (!value || typeof value !== 'object') return false
  const candidate = value as WeatherPreflightStatus
  return (
    ['PASS', 'WARN', 'FAIL'].includes(candidate.status) &&
    typeof candidate.safeToFly === 'boolean' &&
    typeof candidate.summary === 'string' &&
    typeof candidate.windSpeedMps === 'number' &&
    typeof candidate.windGustMps === 'number' &&
    typeof candidate.precipitationMmH === 'number' &&
    typeof candidate.visibilityKm === 'number' &&
    typeof candidate.temperatureC === 'number' &&
    typeof candidate.humidityPercent === 'number' &&
    Array.isArray(candidate.advisories)
  )
}

function isPostflightStatus(value: unknown): value is PostflightCheckStatus {
  if (!value || typeof value !== 'object') return false
  const candidate = value as PostflightCheckStatus
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.overallOk === 'boolean' &&
    typeof candidate.checkedAt === 'string'
  )
}

function readStoredPreflightState(missionId: string, droneLabel?: string | null) {
  if (!droneLabel) return null
  try {
    const raw = window.localStorage.getItem(preflightStateStorageKey(missionId, droneLabel))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredPreflightStatus
    return isRuntimeStatus(parsed.status) ? parsed.status : null
  } catch {
    return null
  }
}

function readStoredWeatherState(missionId: string, droneLabel?: string | null) {
  if (!droneLabel) return null
  try {
    const raw = window.localStorage.getItem(weatherStateStorageKey(missionId, droneLabel))
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredWeatherStatus
    return isWeatherStatus(parsed.status) ? parsed.status : null
  } catch {
    return null
  }
}

function runtimeStatusFromPersisted(persisted: {
  id: string
  status: 'CHECKING' | 'PASSED' | 'FAILED' | 'CANCELLED'
  progressPercent: number
  items?: Array<{
    checkType: string
    checkName: string
    status: 'PENDING' | 'CHECKING' | 'PASSED' | 'FAILED'
    checkLevel?: 'CRITICAL' | 'WARNING' | 'INFO'
    message?: string | null
  }>
}): RuntimePreflightStatus {
  return {
    checkId: persisted.id,
    status:
      persisted.status === 'PASSED'
        ? 'READY'
        : persisted.status === 'FAILED' || persisted.status === 'CANCELLED'
          ? 'FAILED'
          : 'CHECKING',
    progress: persisted.progressPercent,
    checks: (persisted.items ?? []).map((item) => ({
      key: item.checkType,
      name: item.checkName,
      status:
        item.status === 'PASSED'
          ? 'PASS'
          : item.status === 'FAILED'
            ? 'FAIL'
            : item.status,
      message: item.message ?? '',
      critical: item.checkLevel === 'CRITICAL',
    })),
  }
}

async function fetchPersistedPreflight(missionId: string, signal?: AbortSignal) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}/preflight-checks/current`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  if (!persisted || typeof persisted.id !== 'string') return null
  return runtimeStatusFromPersisted(persisted)
}

async function fetchLatestWeatherCheck(missionId: string, signal?: AbortSignal) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/weather/preflight-checks/latest?missionId=${encodeURIComponent(missionId)}`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const weather = payload?.data ?? payload
  return isWeatherStatus(weather) ? weather : null
}

async function fetchLatestPostflightCheck(missionId: string, signal?: AbortSignal) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}/postflight-checks/latest`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const postflight = payload?.data ?? payload
  return isPostflightStatus(postflight) ? postflight : null
}

function formatVnDate(isoDate: string): string {
  if (!isoDate) return 'Chưa lên lịch'
  const d = new Date(`${isoDate}T00:00:00+07:00`)
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return `${weekdays[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`
}

function durationMinutes(start: string, end: string): number {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return eh * 60 + em - (sh * 60 + sm)
}

function formatHm(iso: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(iso)
  return m ? `${m[1]}:${m[2]}` : ''
}

function formatMeters(value?: number | null): string {
  if (value == null) return '—'
  return value >= 1000 ? `${(value / 1000).toFixed(2)} km` : `${Math.round(value)} m`
}

function formatSeconds(value?: number | null): string {
  if (value == null) return '—'
  const minutes = Math.max(1, Math.round(value / 60))
  return `${minutes} phút`
}

function formatPercent(value?: number | null): string {
  return value == null ? '—' : `${value.toFixed(1)}%`
}

export function MissionDetailScreen({ missionId }: { missionId: string }) {
  const query = useApiQuery((signal) => operatorApi.getMission(missionId, signal), [missionId])
  const [showReject, setShowReject] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  useEffect(() => { setActiveMissionId(missionId) }, [missionId])

  if (query.loading) return <LoadingState />
  if (query.error || !query.data) {
    return (
      <EmptyState
        title="Không tải được mission"
        description="Mission có thể không tồn tại hoặc đã bị xoá."
        action={
          <a className="odm-btn odm-btn-p" href={operatorHref({ screen: 'missions' })}>
            Về danh sách
          </a>
        }
      />
    )
  }

  const mission = query.data

  async function handleAccept() {
    setSubmitting(true)
    setActionError(null)
    try {
      await operatorApi.acceptMission(mission.id)
      query.reload()
    } catch {
      setActionError('Không thể chấp nhận mission. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReject(reason: string, notes: string) {
    setSubmitting(true)
    setActionError(null)
    try {
      await operatorApi.rejectMission(mission.id, { reason, notes })
      setShowReject(false)
      query.reload()
    } catch {
      setActionError('Không thể từ chối mission. Vui lòng thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <span className="odm-mono" style={{ fontWeight: 600, fontSize: 14 }}>
          {mission.missionCode ?? mission.id}
        </span>
        <StatusBadge tone={STATUS_TONE[mission.status]}>{STATUS_LABEL[mission.status]}</StatusBadge>
      </div>

      {actionError ? (
        <div
          style={{
            marginBottom: 14,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--red-bg)',
            color: 'var(--red-fg)',
            border: '1px solid var(--red-dot)',
            fontSize: 13,
          }}
        >
          {actionError}
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 380px', gap: 16, alignItems: 'start' }}>
        <MapPlaceholder mission={mission} />
        <InfoPanel mission={mission} />
      </div>

      <Footer
        mission={mission}
        submitting={submitting}
        onAccept={handleAccept}
        onOpenReject={() => setShowReject(true)}
      />

      {showReject ? (
        <RejectDialog
          missionId={mission.id}
          submitting={submitting}
          onCancel={() => setShowReject(false)}
          onConfirm={handleReject}
        />
      ) : null}
    </div>
  )
}

function MapPlaceholder({ mission }: { mission: OperatorMission }) {
  const meta = useSimulationMapMeta()
  const route = mission.planSummary?.waypoints ?? []
  const target = typeof mission.targetX === 'number' && typeof mission.targetY === 'number'
    ? { simX: mission.targetX, simY: mission.targetY }
    : route.at(-1)
  const mapPoints = [
    ...route.map((point) => ({ x: point.simX, y: point.simY })),
    ...(target ? [{ x: target.simX, y: target.simY }] : []),
  ]
  const bounds = mapPoints.length > 0
    ? (meta?.imageBounds ?? meta ?? mapPoints.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y),
      }),
      { minX: mapPoints[0].x, maxX: mapPoints[0].x, minY: mapPoints[0].y, maxY: mapPoints[0].y },
    ))
    : null
  const project = (point: { simX: number; simY: number }) => {
    if (!bounds) return { x: 50, y: 50 }
    if (meta) return worldToViewportPercent(point, meta, SIMULATION_MAP_DEFAULT_CROP)
    const width = Math.max(1, bounds.maxX - bounds.minX)
    const height = Math.max(1, bounds.maxY - bounds.minY)
    const pad = 10
    return {
      x: pad + ((point.simX - bounds.minX) / width) * (100 - pad * 2),
      y: pad + ((bounds.maxY - point.simY) / height) * (100 - pad * 2),
    }
  }
  const svgRoute = route.map(project)
  const polyline = svgRoute.map((point) => `${point.x},${point.y}`).join(' ')
  const targetPoint = target ? project(target) : null
  const monitoringRadius = target && typeof mission.radiusMeters === 'number' && mission.radiusMeters > 0
    ? (() => {
        const simulationRadius = mission.radiusMeters / SIM_RADIUS_SCALE
        const center = project(target)
        const xEdge = project({ simX: target.simX + simulationRadius, simY: target.simY })
        const yEdge = project({ simX: target.simX, simY: target.simY + simulationRadius })
        return {
          cx: center.x,
          cy: center.y,
          rx: Math.max(1.8, Math.abs(xEdge.x - center.x)),
          ry: Math.max(1.8, Math.abs(yEdge.y - center.y)),
          label: `${Math.round(mission.radiusMeters)} m`,
        }
      })()
    : null
  const visibleRouteMarkers = route.filter((point, index) =>
    index === 0 ||
    index === route.length - 1 ||
    point.reason?.toUpperCase() === 'TARGET' ||
    index % 5 === 0)
  const startPoint = route[0]
  const endPoint = route.at(-1)
  const routeHighlights = route.filter((point, index) =>
    index === 0 ||
    index === route.length - 1 ||
    point.reason?.toUpperCase() === 'TARGET' ||
    index % 6 === 0)
  const mapImagePath = meta?.image ?? '/simulation-viewer/simulation_map_top.png'
  const mapImageVersion = meta?.imageVersion ? `?v=${encodeURIComponent(meta.imageVersion)}` : ''
  const mapImageUrl = `${env.apiBaseUrl}${mapImagePath}${mapImageVersion}`
  const imageStyle = simulationMapImageStyle(SIMULATION_MAP_DEFAULT_CROP)

  return (
    <div className="odm-card" style={{ overflow: 'hidden' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(520px, 620px) minmax(260px, 1fr)', gap: 0, alignItems: 'stretch' }}>
      <div
        style={{
          position: 'relative',
          aspectRatio: '1 / 1',
          maxHeight: 'min(68vh, 720px)',
          minHeight: 520,
          overflow: 'hidden',
          background: '#d7ded7',
        }}
      >
        <img
          alt=""
          src={mapImageUrl}
          style={{
            position: 'absolute',
            ...imageStyle,
            objectFit: 'fill',
            opacity: 0.96,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,.08)', pointerEvents: 'none' }} />
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            padding: '8px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,.88)',
            boxShadow: '0 8px 22px rgba(15,23,42,.12)',
            maxWidth: 360,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700 }}>{mission.location}</div>
          <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>
            {mission.planSummary?.planningAlgorithm ?? 'A*'} · {route.length} waypoint · {formatMeters(mission.planSummary?.plannedDistanceM)}
          </div>
        </div>
        {target ? (
          <div
            style={{
              position: 'absolute',
              right: 12,
              top: 12,
              padding: '8px 10px',
              borderRadius: 8,
              background: 'rgba(254,242,242,.92)',
              color: '#991b1b',
              border: '1px solid rgba(239,68,68,.35)',
              fontSize: 11.5,
              fontWeight: 700,
              boxShadow: '0 8px 22px rgba(15,23,42,.10)',
            }}
          >
            TARGET · X {target.simX.toFixed(1)} · Y {target.simY.toFixed(1)}
          </div>
        ) : null}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ position: 'absolute', inset: 0, overflow: 'visible' }}
        >
          {monitoringRadius ? (
            <g>
              <ellipse
                cx={monitoringRadius.cx}
                cy={monitoringRadius.cy}
                rx={monitoringRadius.rx}
                ry={monitoringRadius.ry}
                fill="#22c55e"
                fillOpacity="0.16"
                stroke="#16a34a"
                strokeWidth="1.6"
                strokeDasharray="5 4"
                strokeOpacity="0.92"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={monitoringRadius.cx}
                y={Math.max(4, monitoringRadius.cy - monitoringRadius.ry - 2.5)}
                textAnchor="middle"
                fontSize="2.7"
                fontWeight="800"
                fill="#15803d"
              >
                VUNG GIAM SAT · R {monitoringRadius.label}
              </text>
            </g>
          ) : null}
          {polyline ? (
            <polyline
              points={polyline}
              fill="none"
              stroke="#1d4ed8"
              strokeWidth="2.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeOpacity="0.96"
              vectorEffect="non-scaling-stroke"
            />
          ) : null}
          {targetPoint ? (
            <g>
              <circle cx={targetPoint.x} cy={targetPoint.y} r="5.4" fill="#ef4444" opacity="0.22" />
              <circle cx={targetPoint.x} cy={targetPoint.y} r="2.4" fill="#ef4444" stroke="#fff" strokeWidth="0.8" vectorEffect="non-scaling-stroke" />
              <text x={targetPoint.x} y={targetPoint.y - 4.8} textAnchor="middle" fontSize="2.8" fontWeight="800" fill="#b91c1c">TARGET</text>
            </g>
          ) : null}
          {visibleRouteMarkers.map((point, markerIndex) => {
            const index = route.findIndex((item) => item.id === point.id)
            const projected = project(point)
            const isHome = index === 0
            const isTarget = index === route.length - 1 || point.reason?.toUpperCase() === 'TARGET'
            const label = isHome ? 'H' : isTarget ? 'T' : `${point.sequence}`
            return (
              <g key={`${point.id}-${markerIndex}`}>
                <circle
                  cx={projected.x}
                  cy={projected.y}
                  r={isHome || isTarget ? '3.2' : '2.5'}
                  fill={isHome ? '#0f172a' : isTarget ? '#ef4444' : '#2563eb'}
                  stroke="#fff"
                  strokeWidth="0.9"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={projected.x}
                  y={projected.y + 0.75}
                  textAnchor="middle"
                  fontSize={isHome || isTarget ? '2.8' : '2.3'}
                  fontWeight="800"
                  fill="#fff"
                >
                  {label}
                </text>
              </g>
            )
          })}
        </svg>
        {route.length === 0 ? (
          <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: 'var(--tx3)', fontSize: 13, fontWeight: 600 }}>
            Chưa có waypoint A*
          </div>
        ) : null}
      </div>
      <div
        style={{
          borderLeft: '1px solid var(--bd)',
          background: '#fff',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 520,
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Route overview</div>
          <div style={{ color: 'var(--tx3)', fontSize: 12 }}>
            A* route trên map mô phỏng
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <MiniMetric label="Waypoint" value={`${route.length}`} />
          <MiniMetric label="Distance" value={formatMeters(mission.planSummary?.plannedDistanceM)} />
          <MiniMetric label="Duration" value={formatSeconds(mission.planSummary?.plannedDurationSec)} />
          <MiniMetric label="Altitude" value={formatMeters(mission.planSummary?.maxPlannedAltitudeM)} />
        </div>

        <div style={{ border: '1px solid var(--bd)', borderRadius: 8, overflow: 'hidden' }}>
          <RoutePointRow
            tone="dark"
            label="HOME"
            point={startPoint}
          />
          <RoutePointRow
            tone="red"
            label="TARGET"
            point={target ? { id: 'target', sequence: endPoint?.sequence ?? 0, simX: target.simX, simY: target.simY, altitudeM: endPoint?.altitudeM, reason: 'TARGET' } : endPoint}
          />
        </div>

        <div style={{ flex: 1, minHeight: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>
            Điểm chính trên đường bay
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 250, overflow: 'auto', paddingRight: 4 }}>
            {routeHighlights.length > 0 ? routeHighlights.map((point) => (
              <div
                key={`highlight-${point.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '42px 1fr',
                  gap: 8,
                  alignItems: 'center',
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: point.reason?.toUpperCase() === 'TARGET' ? '#fef2f2' : 'var(--sf2)',
                  border: '1px solid var(--bd)',
                }}
              >
                <span style={{ fontWeight: 800, color: point.reason?.toUpperCase() === 'TARGET' ? '#b91c1c' : 'var(--blue-dot)' }}>
                  WP {point.sequence}
                </span>
                <span style={{ fontSize: 12, color: 'var(--tx2)' }}>
                  X {point.simX.toFixed(1)} · Y {point.simY.toFixed(1)} · {point.reason ?? 'CRUISE'}
                </span>
              </div>
            )) : (
              <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>Chưa có waypoint.</div>
            )}
          </div>
        </div>
      </div>
      </div>
      <div style={{ maxHeight: 180, overflow: 'auto', borderTop: '1px solid var(--bd)', background: '#fff' }}>
        <table className="odm-table" style={{ fontSize: 11.5 }}>
          <thead>
            <tr>
              <th>WP</th>
              <th>Sim X</th>
              <th>Sim Y</th>
              <th>Alt</th>
              <th>Speed</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {route.length > 0 ? route.map((point) => (
              <tr key={point.id}>
                <td>{point.sequence}</td>
                <td>{point.simX.toFixed(2)}</td>
                <td>{point.simY.toFixed(2)}</td>
                <td>{point.altitudeM == null ? '—' : `${point.altitudeM.toFixed(1)} m`}</td>
                <td>{point.plannedSpeedMps == null ? '—' : `${point.plannedSpeedMps.toFixed(1)} m/s`}</td>
                <td>{point.reason ?? '—'}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ color: 'var(--tx3)' }}>Chưa có dữ liệu mission plan.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: '1px solid var(--bd)', borderRadius: 8, padding: '10px 12px', background: 'var(--sf2)' }}>
      <div style={{ color: 'var(--tx3)', fontSize: 11.5, marginBottom: 4 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 15 }}>{value}</div>
    </div>
  )
}

function RoutePointRow({
  label,
  point,
  tone,
}: {
  label: string
  point?: OperatorMissionPlanWaypoint
  tone: 'dark' | 'red'
}) {
  const color = tone === 'red' ? '#b91c1c' : '#0f172a'
  const background = tone === 'red' ? '#fef2f2' : '#f8fafc'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 12px', background, borderBottom: '1px solid var(--bd)' }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 800, color }}>{label}</div>
        <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 2 }}>
          {point ? `WP ${point.sequence} · ${point.reason ?? '—'}` : 'Chưa có điểm'}
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, fontWeight: 700 }}>
        {point ? (
          <>
            <div>X {point.simX.toFixed(1)}</div>
            <div>Y {point.simY.toFixed(1)}</div>
          </>
        ) : '—'}
      </div>
    </div>
  )
}

function InfoPanel({ mission }: { mission: OperatorMission }) {
  const minutes = durationMinutes(mission.startTime, mission.endTime)
  const [preflightStatus, setPreflightStatus] = useState<RuntimePreflightStatus | null>(() =>
    readStoredPreflightState(mission.id, mission.droneCode),
  )
  const [weatherStatus, setWeatherStatus] = useState<WeatherPreflightStatus | null>(() =>
    readStoredWeatherState(mission.id, mission.droneCode),
  )
  const [postflightStatus, setPostflightStatus] = useState<PostflightCheckStatus | null>(null)

  useEffect(() => {
    setPreflightStatus(readStoredPreflightState(mission.id, mission.droneCode))
    setWeatherStatus(readStoredWeatherState(mission.id, mission.droneCode))
    setPostflightStatus(null)
    const controller = new AbortController()
    fetchPersistedPreflight(mission.id, controller.signal)
      .then((status) => {
        if (status) setPreflightStatus(status)
      })
      .catch(() => {
        // Local precheck cache is still shown if backend history is unavailable.
      })
    fetchLatestWeatherCheck(mission.id, controller.signal)
      .then((status) => {
        if (status) setWeatherStatus(status)
      })
      .catch(() => {
        // Local weather cache is still shown if backend history is unavailable.
      })
    fetchLatestPostflightCheck(mission.id, controller.signal)
      .then((status) => {
        setPostflightStatus(status)
      })
      .catch(() => {
        setPostflightStatus(null)
      })
    return () => controller.abort()
  }, [mission.droneCode, mission.id])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="odm-card">
        <div className="odm-card-body" style={{ padding: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>{mission.title}</div>
          <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>
            {mission.serviceLabel}
          </div>

          <Row label="Ngày bay" value={formatVnDate(mission.date)} />
          <Row
            label="Khung giờ"
            value={mission.startTime && mission.endTime ? `${mission.startTime}–${mission.endTime} · ${minutes} phút` : 'Chưa lên lịch'}
          />
          <Row label="Địa điểm" value={mission.location} />
          <Row
            label="Vùng giám sát"
            value={`Bán kính ${mission.radiusMeters == null ? '—' : `${mission.radiusMeters} m`} · trần bay ${mission.ceilingMeters == null ? '—' : `${mission.ceilingMeters} m`}`}
          />
          <Row
            label="Yêu cầu media"
            value={mission.serviceLabel}
          />
        </div>
      </div>

      <div className="odm-card">
        <div className="odm-card-body" style={{ padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 10 }}>
            Mission planning A*
          </div>
          {mission.planSummary ? (
            <>
              <Row label="Thuật toán" value={mission.planSummary.planningAlgorithm ?? 'A*'} />
              <Row label="Trạng thái" value={mission.planSummary.feasibilityStatus ?? 'Đã tạo'} />
              <Row label="Waypoint" value={`${mission.planSummary.waypointCount}`} />
              <Row label="Quãng đường" value={formatMeters(mission.planSummary.plannedDistanceM)} />
              <Row label="Thời lượng dự kiến" value={formatSeconds(mission.planSummary.plannedDurationSec)} />
              <Row label="Trần bay" value={formatMeters(mission.planSummary.maxPlannedAltitudeM)} />
              <Row label="Pin trước bay" value={formatPercent(mission.planSummary.availableBatteryPercentAtPlanning)} />
              <Row label="Pin dùng dự kiến" value={formatPercent(mission.planSummary.estimatedBatteryUsedPercent)} />
              <Row label="Pin còn lại" value={formatPercent(mission.planSummary.estimatedRemainingBatteryPercent)} />
            </>
          ) : (
            <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
              Chưa có plan A*. Operator nhận mission xong hệ thống sẽ tạo tự động.
            </div>
          )}
        </div>
      </div>

      <div className="odm-card">
        <div className="odm-card-body" style={{ padding: 16 }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
            {mission.droneName && mission.droneName !== mission.droneCode ? `${mission.droneCode} ${mission.droneName}` : mission.droneCode ?? 'Chưa gán drone'}
          </div>
          <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 2 }}>
            {mission.droneModel ?? '—'}
          </div>
          <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 2 }}>
            Payload {mission.dronePayload ?? '—'}
          </div>
          <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 8 }}>
            Lấy tại {mission.droneStation ?? '—'} · cách {mission.droneStationDistanceKm == null ? '—' : `${mission.droneStationDistanceKm} km`}
          </div>
          <div style={{ display: 'flex', gap: 12, fontSize: 12 }}>
            <StatusBadge tone="gray">{mission.droneReadinessPct == null ? 'Chưa có telemetry' : `${mission.droneReadinessPct}% Sẵn sàng`}</StatusBadge>
            <span style={{ color: 'var(--tx3)' }}>
              {mission.droneHoursSinceMaintenance == null ? 'Chưa có dữ liệu bảo trì' : `${mission.droneHoursSinceMaintenance} giờ bay từ lần bảo trì`}
            </span>
          </div>
        </div>
      </div>

      <PreflightResultCard preflight={preflightStatus} weather={weatherStatus} />

      <PostflightResultCard postflight={postflightStatus} />

      {mission.managerNote ? (
        <div
          className="odm-card"
          style={{ background: 'var(--yellow-bg)', borderColor: 'var(--yellow-dot)' }}
        >
          <div className="odm-card-body" style={{ padding: 16 }}>
            <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 6, color: 'var(--yellow-fg)' }}>
              Ghi chú của quản lý · {mission.managerName ?? ''}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--yellow-fg)', marginBottom: 8 }}>
              {mission.managerNote}
            </div>
            {mission.respondBy && mission.status === 'PENDING' ? (
              <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--yellow-fg)' }}>
                Hãy phản hồi trước {formatVnDate(mission.respondBy.slice(0, 10))} {formatHm(mission.respondBy)}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '6px 0', fontSize: 12.5, borderTop: '1px solid var(--bd)' }}>
      <span style={{ color: 'var(--tx3)' }}>{label}</span>
      <span style={{ fontWeight: 500, textAlign: 'right' }}>{value}</span>
    </div>
  )
}

function statusTone(status?: RuntimeOverallStatus | WeatherCheckStatus) {
  if (status === 'READY' || status === 'PASS') return 'green'
  if (status === 'FAILED' || status === 'FAIL') return 'red'
  if (status === 'WARN') return 'yellow'
  return 'gray'
}

function preflightLabel(status?: RuntimeOverallStatus) {
  if (status === 'READY') return 'PASSED'
  if (status === 'FAILED') return 'FAILED'
  if (status === 'CHECKING') return 'CHECKING'
  return 'Chưa trigger'
}

function checkLabel(status: RuntimeStatus) {
  if (status === 'PASS') return 'Đạt'
  if (status === 'WARN') return 'Cảnh báo'
  if (status === 'FAIL') return 'Không đạt'
  if (status === 'CHECKING') return 'Đang kiểm'
  return 'Chờ kiểm'
}

function okLabel(value?: boolean | null) {
  if (value === true) return 'Đạt'
  if (value === false) return 'Không đạt'
  return '—'
}

function formatNumber(value?: number | null, suffix = '', decimals = 1) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `${value.toFixed(decimals)}${suffix}`
}

function postflightFaultLabel(faultType?: string | null) {
  if (!faultType) return null
  if (faultType === 'PHYSICAL_DAMAGE') return 'Thân vỏ cần kiểm tra'
  if (faultType === 'BATTERY') return 'Pin cần kiểm tra'
  if (faultType === 'HARDWARE') return 'Phần cứng cần kiểm tra'
  return faultType.replaceAll('_', ' ')
}

function postflightNoteLabel(notes?: string | null) {
  if (!notes) return ''
  const cleaned = notes
    .replace(/^Inspection:\s*[^.]*\.\s*/i, '')
    .trim()
  return cleaned
}

function formatCheckedAt(value?: string) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}

function PreflightResultCard({
  preflight,
  weather,
}: {
  preflight: RuntimePreflightStatus | null
  weather: WeatherPreflightStatus | null
}) {
  const passCount = preflight?.checks.filter((item) => item.status === 'PASS' || item.status === 'WARN').length ?? 0
  const failCount = preflight?.checks.filter((item) => item.status === 'FAIL').length ?? 0
  const visibleChecks = preflight?.checks.slice(0, 6) ?? []

  return (
    <div className="odm-card">
      <div className="odm-card-body" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Kết quả precheck & thời tiết</div>
          <StatusBadge tone={statusTone(preflight?.status)}>
            {preflightLabel(preflight?.status)}
          </StatusBadge>
        </div>

        {preflight ? (
          <>
            <Row label="Mã check" value={preflight.checkId} />
            <Row label="Tiến độ" value={`${Math.round(preflight.progress)}% · ${passCount} đạt${failCount ? ` · ${failCount} lỗi` : ''}`} />
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {visibleChecks.map((item) => (
                <div
                  key={`${item.key}-${item.name}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 8,
                    padding: '8px 10px',
                    border: '1px solid var(--bd)',
                    borderRadius: 8,
                    background: item.status === 'FAIL' ? 'var(--red-bg)' : 'var(--sf2)',
                    fontSize: 12,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={{ color: item.status === 'FAIL' ? 'var(--red-fg)' : 'var(--tx3)', marginTop: 2 }}>
                      {item.message || 'Đã kiểm tra'}
                    </div>
                  </div>
                  <span style={{ fontWeight: 800, color: item.status === 'FAIL' ? 'var(--red-fg)' : 'var(--green-fg)' }}>
                    {checkLabel(item.status)}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
            Chưa có dữ liệu precheck cho mission này.
          </div>
        )}

        <div style={{ borderTop: '1px solid var(--bd)', marginTop: 12, paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 12.5 }}>Thời tiết bay</div>
            <StatusBadge tone={statusTone(weather?.status)}>
              {weather ? (weather.safeToFly ? 'SAFE' : weather.status) : 'Chưa check'}
            </StatusBadge>
          </div>
          {weather ? (
            <>
              <div style={{ fontSize: 12.5, color: 'var(--tx2)', lineHeight: 1.45, marginBottom: 8 }}>
                {weather.summary}
              </div>
              <Row label="Gió / giật" value={`${weather.windSpeedMps.toFixed(1)} / ${weather.windGustMps.toFixed(1)} m/s`} />
              <Row label="Mưa" value={`${weather.precipitationMmH.toFixed(1)} mm/h`} />
              <Row label="Tầm nhìn" value={`${weather.visibilityKm.toFixed(1)} km`} />
              <Row label="Nhiệt / ẩm" value={`${weather.temperatureC.toFixed(1)}°C · ${weather.humidityPercent.toFixed(0)}%`} />
              <Row label="Thời điểm check" value={formatCheckedAt(weather.checkedAt)} />
              {weather.advisories.length > 0 ? (
                <div style={{ marginTop: 8, color: 'var(--tx3)', fontSize: 12 }}>
                  {weather.advisories.join(' · ')}
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
              Chưa có kết quả check thời tiết.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PostflightResultCard({ postflight }: { postflight: PostflightCheckStatus | null }) {
  const issueText = postflightFaultLabel(postflight?.faultType)
  const noteText = postflightNoteLabel(postflight?.notes)
  const checks: Array<[string, boolean | null | undefined]> = [
    ['Thân vỏ', postflight?.physicalConditionOk],
    ['Motor', postflight?.motorOk],
    ['Pin', postflight?.batteryOk],
    ['Camera', postflight?.cameraOk],
    ['GPS', postflight?.gpsOk],
    ['Kết nối', postflight?.communicationOk],
  ]

  return (
    <div className="odm-card">
      <div className="odm-card-body" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Kết quả postcheck</div>
          <StatusBadge tone={postflight ? (postflight.overallOk ? 'green' : 'red') : 'gray'}>
            {postflight ? (postflight.overallOk ? 'OK' : 'Cần bảo trì') : 'Chưa postcheck'}
          </StatusBadge>
        </div>

        {postflight ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
              <PostflightMetric label="Drone" value={postflight.droneCode ?? '—'} />
              <PostflightMetric label="Check lúc" value={formatCheckedAt(postflight.checkedAt)} />
              <PostflightMetric label="Pin hạ cánh" value={formatNumber(postflight.landingBatteryPercent, '%')} />
              <PostflightMetric label="Trạng thái pin" value={postflight.landingBatteryState ?? '—'} />
              <PostflightMetric label="Độ cao" value={formatNumber(postflight.landingAltitudeM, ' m')} />
              <PostflightMetric label="Tốc độ" value={formatNumber(postflight.landingSpeedMps, ' m/s')} />
              <PostflightMetric label="Heading" value={formatNumber(postflight.landingHeadingDeg, '°', 0)} />
              <PostflightMetric label="Telemetry" value={postflight.landingTelemetryOnline == null ? '—' : postflight.landingTelemetryOnline ? 'Online' : 'Offline'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {checks.map(([label, value]) => (
                <div
                  key={String(label)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 8,
                    border: '1px solid var(--bd)',
                    background: value === false ? 'var(--red-bg)' : 'var(--sf2)',
                    fontSize: 12,
                    minHeight: 34,
                    alignItems: 'center',
                  }}
                >
                  <span style={{ color: 'var(--tx3)' }}>{label}</span>
                  <span style={{ fontWeight: 800, color: value === false ? 'var(--red-fg)' : 'var(--green-fg)' }}>
                    {okLabel(value as boolean | null | undefined)}
                  </span>
                </div>
              ))}
            </div>

            {issueText || noteText ? (
              <div
                style={{
                  marginTop: 12,
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${postflight.overallOk ? 'var(--bd)' : 'var(--red-dot)'}`,
                  background: postflight.overallOk ? 'var(--sf2)' : 'var(--red-bg)',
                  color: postflight.overallOk ? 'var(--tx2)' : 'var(--red-fg)',
                  fontSize: 12.5,
                  lineHeight: 1.45,
                }}
              >
                {issueText ? <div style={{ fontWeight: 800 }}>{issueText}</div> : null}
                {noteText ? <div style={{ marginTop: issueText ? 4 : 0 }}>{noteText}</div> : null}
              </div>
            ) : null}
          </>
        ) : (
          <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
            Chưa có kết quả postcheck cho mission này.
          </div>
        )}
      </div>
    </div>
  )
}

function PostflightMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '8px 10px',
        borderRadius: 8,
        border: '1px solid var(--bd)',
        background: 'var(--sf2)',
        minWidth: 0,
      }}
    >
      <div style={{ color: 'var(--tx3)', fontSize: 11.5, marginBottom: 3 }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 12.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value}
      </div>
    </div>
  )
}

function Footer({
  mission,
  submitting,
  onAccept,
  onOpenReject,
}: {
  mission: OperatorMission
  submitting: boolean
  onAccept: () => void
  onOpenReject: () => void
}) {
  if (mission.status === 'PENDING') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <button type="button" className="odm-btn odm-btn-rd" onClick={onOpenReject} disabled={submitting}>
          Từ chối
        </button>
        <button type="button" className="odm-btn odm-btn-p" onClick={onAccept} disabled={submitting}>
          {submitting ? 'Đang xử lý...' : 'Chấp nhận'}
        </button>
      </div>
    )
  }

  if (mission.status === 'ACCEPTED') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          marginTop: 16,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'var(--green-bg)',
          color: 'var(--green-fg)',
          border: '1px solid var(--green-dot)',
          fontSize: 13,
        }}
      >
        <span>
          Mission đã được nhận · {mission.backendStatus ?? 'SCHEDULED'}
        </span>
        <a className="odm-btn odm-btn-sm" href={operatorHref({ screen: 'connect', missionId: mission.id })}>
          Kết nối GCS
        </a>
      </div>
    )
  }

  if (mission.status === 'IN_FLIGHT') {
    return (
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
        <a className="odm-btn" href={operatorHref({ screen: 'upload', missionId: mission.id })}>Review media</a>
        <a className="odm-btn odm-btn-p" href={operatorHref({ screen: 'flight', missionId: mission.id })}>Mở buồng lái</a>
      </div>
    )
  }

  return null
}
