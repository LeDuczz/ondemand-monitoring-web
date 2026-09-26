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
import type { OperatorMission } from '../types/mission'
import { RejectDialog } from './RejectDialog'

// ─── Status maps ────────────────────────────────────────────────────────────

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

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Hooks ───────────────────────────────────────────────────────────────────

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

// ─── Storage helpers ─────────────────────────────────────────────────────────

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

// ─── API helpers ─────────────────────────────────────────────────────────────

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

// ─── Format helpers ───────────────────────────────────────────────────────────

function formatVnDate(isoDate: string): string {
  if (!isoDate) return 'Chưa lên lịch'
  const d = new Date(`${isoDate}T00:00:00+07:00`)
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  return `${weekdays[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`
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

function missionDescriptionText(description: string | undefined): string {
  const text = description?.trim() ?? ''
  const lower = text.toLowerCase()
  if (!text || text.length < 2 || lower === 'n/a' || lower === 'na' || lower === 'none') {
    return 'Chưa có mô tả'
  }
  return text
}

function waypointReasonLabel(value?: string | null): string {
  if (!value) return 'Điểm bay'
  if (value === 'START') return 'Điểm xuất phát'
  if (value === 'TARGET') return 'Điểm giám sát'
  if (value === 'CRUISE') return 'Điểm trung gian'
  return value.replaceAll('_', ' ').toLowerCase()
}

function locationLabel(value: string): string {
  if (value === 'Construction Site') return 'Công trường'
  if (value === 'Dam') return 'Đập nước / hồ chứa'
  if (value === 'Warehouse') return 'Kho bãi'
  return value || 'Chưa có địa điểm'
}

function routeDurationNote(value?: number | null): string {
  const duration = formatSeconds(value)
  return `${duration} là thời gian bay ước tính từ điểm xuất phát đến vùng giám sát theo đường bay tự động.`
}

function altitudeNote(value?: number | null): string {
  const altitude = formatMeters(value)
  return `${altitude} là độ cao bay dự kiến của drone trong bản đồ mô phỏng.`
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
  return notes.replace(/^Inspection:\s*[^.]*\.\s*/i, '').trim()
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

// ─── Main screen ─────────────────────────────────────────────────────────────

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
    <>
      <MissionDashboard
        mission={mission}
        submitting={submitting}
        actionError={actionError}
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
    </>
  )
}

// ─── Dashboard shell ──────────────────────────────────────────────────────────

function MissionDashboard({
  mission,
  submitting,
  actionError,
  onAccept,
  onOpenReject,
}: {
  mission: OperatorMission
  submitting: boolean
  actionError: string | null
  onAccept: () => void
  onOpenReject: () => void
}) {
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
    <div>
      {/* ── Header ── */}
      <MissionHeader
        mission={mission}
        submitting={submitting}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
      />

      {actionError ? (
        <div
          style={{
            marginBottom: 12,
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

      {/* ── Independent dashboard columns ── */}
      <div className="mds-main-grid">
        {/* LEFT: map + waypoint table */}
        <div className="mds-col mds-left-col">
          <MissionMapCard mission={mission} />
          <WaypointTableCard mission={mission} />
        </div>

        {/* CENTER: flight summary + weather */}
        <div className="mds-col mds-center-col">
          <FlightSummaryCard mission={mission} />
          <WeatherCard weather={weatherStatus} />
        </div>

        {/* RIGHT: info + device + precheck + postcheck */}
        <div className="mds-col mds-right-col">
          <MissionInfoCard mission={mission} />
          <DroneDeviceCard mission={mission} />
          <PrecheckCard preflight={preflightStatus} />
          <PostcheckCard postflight={postflightStatus} />
          {mission.managerNote ? <ManagerNoteCard mission={mission} /> : null}
        </div>
      </div>
    </div>
  )
}

// ─── Mission Header ───────────────────────────────────────────────────────────

function MissionHeader({
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
  return (
    <div className="mds-header">
      {/* Row 1: code + badge + actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <a
          href={operatorHref({ screen: 'missions' })}
          className="odm-btn odm-btn-sm odm-btn-ic1"
          style={{ flexShrink: 0, fontSize: 16 }}
          title="Về danh sách"
        >
          ←
        </a>
        <span className="odm-mono" style={{ fontWeight: 700, fontSize: 16, letterSpacing: '0.01em' }}>
          {mission.missionCode ?? mission.id}
        </span>
        <StatusBadge tone={STATUS_TONE[mission.status]}>
          {STATUS_LABEL[mission.status]}
        </StatusBadge>

        {/* spacer */}
        <div style={{ flex: 1 }} />

        {/* Action buttons (same logic as original Footer) */}
        {mission.status === 'PENDING' ? (
          <>
            <button type="button" className="odm-btn odm-btn-rd" onClick={onOpenReject} disabled={submitting}>
              Từ chối
            </button>
            <button type="button" className="odm-btn odm-btn-p" onClick={onAccept} disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Chấp nhận'}
            </button>
          </>
        ) : mission.status === 'ACCEPTED' ? (
          <a className="odm-btn odm-btn-p" href={operatorHref({ screen: 'connect', missionId: mission.id })}>
            Kết nối GCS
          </a>
        ) : mission.status === 'IN_FLIGHT' ? (
          <>
            <a className="odm-btn" href={operatorHref({ screen: 'upload', missionId: mission.id })}>
              Review media
            </a>
            <a className="odm-btn odm-btn-p" href={operatorHref({ screen: 'flight', missionId: mission.id })}>
              Mở buồng lái
            </a>
          </>
        ) : null}
      </div>

    </div>
  )
}

// ─── Map card ─────────────────────────────────────────────────────────────────

function MissionMapCard({ mission }: { mission: OperatorMission }) {
  const meta = useSimulationMapMeta()
  const route = mission.planSummary?.waypoints ?? []
  const target =
    typeof mission.targetX === 'number' && typeof mission.targetY === 'number'
      ? { simX: mission.targetX, simY: mission.targetY }
      : route.at(-1)
  const mapPoints = [
    ...route.map((p) => ({ x: p.simX, y: p.simY })),
    ...(target ? [{ x: target.simX, y: target.simY }] : []),
  ]
  const bounds =
    mapPoints.length > 0
      ? (meta?.imageBounds ??
        meta ??
        mapPoints.reduce(
          (acc, p) => ({
            minX: Math.min(acc.minX, p.x),
            maxX: Math.max(acc.maxX, p.x),
            minY: Math.min(acc.minY, p.y),
            maxY: Math.max(acc.maxY, p.y),
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
  const polyline = svgRoute.map((p) => `${p.x},${p.y}`).join(' ')
  const targetPoint = target ? project(target) : null

  const monitoringRadius =
    target && typeof mission.radiusMeters === 'number' && mission.radiusMeters > 0
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

  const visibleRouteMarkers = route

  const mapImagePath = meta?.image ?? '/simulation-viewer/simulation_map_top.png'
  const mapImageVersion = meta?.imageVersion ? `?v=${encodeURIComponent(meta.imageVersion)}` : ''
  const mapImageUrl = `${env.apiBaseUrl}${mapImagePath}${mapImageVersion}`
  const imageStyle = simulationMapImageStyle(SIMULATION_MAP_DEFAULT_CROP)

  return (
    <div className="odm-card" style={{ overflow: 'hidden' }}>
      {/* Map viewport */}
      <div className="mds-map-viewport" style={{ position: 'relative', background: '#d7ded7', overflow: 'hidden' }}>
        {/* Map image */}
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
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(255,255,255,.06)',
            pointerEvents: 'none',
          }}
        />

        {/* Legend overlay — top left */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            background: 'rgba(255,255,255,0.93)',
            borderRadius: 8,
            padding: '8px 12px',
            boxShadow: '0 2px 10px rgba(15,23,42,0.13)',
            zIndex: 10,
            minWidth: 155,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 6, color: 'var(--tx)' }}>
            Bản đồ mission
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {[
              { color: '#0f172a', label: 'Vị trí drone', shape: 'circle' },
              { color: '#1d4ed8', label: 'Đường bay', shape: 'line' },
              { color: '#2563eb', label: 'Waypoint', shape: 'circle' },
              { color: '#ef4444', label: 'Điểm giám sát', shape: 'circle' },
              { color: '#22c55e', label: 'Khu vực giám sát', shape: 'dashed' },
            ].map(({ color, label, shape }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--tx2)' }}>
                {shape === 'line' ? (
                  <div style={{ width: 14, height: 2, background: color, borderRadius: 1, flexShrink: 0 }} />
                ) : shape === 'dashed' ? (
                  <div style={{ width: 14, height: 2, borderTop: `2px dashed ${color}`, flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                )}
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Target label — top right */}
        {target ? (
          <div
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
              padding: '7px 10px',
              borderRadius: 8,
              background: 'rgba(254,242,242,.93)',
              color: '#991b1b',
              border: '1px solid rgba(239,68,68,.35)',
              fontSize: 11.5,
              fontWeight: 700,
              boxShadow: '0 2px 10px rgba(15,23,42,.10)',
              zIndex: 10,
            }}
          >
            ĐIỂM GIÁM SÁT · X {target.simX.toFixed(1)} · Y {target.simY.toFixed(1)}
          </div>
        ) : null}

        {/* Zoom controls — right side */}
        <div
          style={{
            position: 'absolute',
            right: 10,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            zIndex: 10,
          }}
        >
          {['+', '−', '⊞'].map((label) => (
            <div
              key={label}
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.92)',
                border: '1px solid rgba(0,0,0,0.12)',
                borderRadius: 6,
                fontSize: label === '⊞' ? 13 : 16,
                fontWeight: 600,
                color: 'var(--tx2)',
                cursor: 'default',
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}
            >
              {label}
            </div>
          ))}
        </div>

        {/* SVG overlay */}
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
                VÙNG GIÁM SÁT · BÁN KÍNH {monitoringRadius.label}
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
              <circle
                cx={targetPoint.x}
                cy={targetPoint.y}
                r="2.4"
                fill="#ef4444"
                stroke="#fff"
                strokeWidth="0.8"
                vectorEffect="non-scaling-stroke"
              />
              <text
                x={targetPoint.x}
                y={targetPoint.y - 4.8}
                textAnchor="middle"
                fontSize="2.8"
                fontWeight="800"
                fill="#b91c1c"
              >
                GIÁM SÁT
              </text>
            </g>
          ) : null}
          {visibleRouteMarkers.map((point, markerIndex) => {
            const index = route.findIndex((item) => item.id === point.id)
            const projected = project(point)
            const isHome = index === 0
            const isTarget = index === route.length - 1 || point.reason?.toUpperCase() === 'TARGET'
            const label = isHome ? 'H' : isTarget ? 'T' : `${point.sequence}`
            const markerRadius = isHome || isTarget ? 3.2 : 2.15
            return (
              <g key={`${point.id}-${markerIndex}`}>
                <title>
                  {`WP ${point.sequence} · ${waypointReasonLabel(point.reason)} · X ${point.simX.toFixed(2)} · Y ${point.simY.toFixed(2)}`}
                </title>
                <circle
                  cx={projected.x}
                  cy={projected.y}
                  r={markerRadius + 1.6}
                  fill={isHome ? '#0f172a' : isTarget ? '#ef4444' : '#2563eb'}
                  opacity={isHome || isTarget ? '0.18' : '0.13'}
                />
                <circle
                  cx={projected.x}
                  cy={projected.y}
                  r={markerRadius}
                  fill={isHome ? '#0f172a' : isTarget ? '#ef4444' : '#2563eb'}
                  stroke="#fff"
                  strokeWidth="0.9"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={projected.x}
                  y={projected.y + 0.75}
                  textAnchor="middle"
                  fontSize={isHome || isTarget ? '2.8' : '2'}
                  fontWeight="800"
                  fill="#fff"
                >
                  {label}
                </text>
                {!isHome && !isTarget ? (
                  <text
                    x={projected.x}
                    y={projected.y - 3.4}
                    textAnchor="middle"
                    fontSize="2"
                    fontWeight="800"
                    fill="#1d4ed8"
                    stroke="rgba(255,255,255,.85)"
                    strokeWidth="0.35"
                    paintOrder="stroke"
                  >
                    WP {point.sequence}
                  </text>
                ) : null}
              </g>
            )
          })}
        </svg>

        {/* Satellite toggle — bottom left */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, zIndex: 10 }}>
          <div
            style={{
              padding: '5px 12px',
              borderRadius: 6,
              background: 'rgba(15,23,42,0.78)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'default',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }}
          >
            Vệ tinh
          </div>
        </div>

        {route.length === 0 ? (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'grid',
              placeItems: 'center',
              color: 'var(--tx3)',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Chưa có điểm bay tự động
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ─── Waypoint table card ──────────────────────────────────────────────────────

function WaypointTableCard({ mission }: { mission: OperatorMission }) {
  const route = mission.planSummary?.waypoints ?? []
  return (
    <div className="odm-card" style={{ overflow: 'hidden' }}>
      <div className="odm-card-header">
        <span>Danh sách điểm bay</span>
      </div>
      <div className="mds-waypoint-scroll" style={{ maxHeight: 230, overflowY: 'auto' }}>
        <table className="odm-table" style={{ fontSize: 11.5 }}>
          <thead>
            <tr>
              <th>Điểm</th>
              <th>X mô phỏng</th>
              <th>Y mô phỏng</th>
              <th>Độ cao</th>
              <th>Tốc độ</th>
              <th>Vai trò</th>
            </tr>
          </thead>
          <tbody>
            {route.length > 0 ? (
              route.map((point) => (
                <tr key={point.id}>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          flexShrink: 0,
                          background:
                            point.reason?.toUpperCase() === 'TARGET'
                              ? '#ef4444'
                              : point.reason?.toUpperCase() === 'START' || point.sequence === 0
                                ? '#0f172a'
                                : '#2563eb',
                        }}
                      />
                      {point.sequence}
                    </span>
                  </td>
                  <td>{point.simX.toFixed(2)}</td>
                  <td>{point.simY.toFixed(2)}</td>
                  <td>{point.altitudeM == null ? '—' : `${point.altitudeM.toFixed(1)} m`}</td>
                  <td>{point.plannedSpeedMps == null ? '—' : `${point.plannedSpeedMps.toFixed(1)} m/s`}</td>
                  <td>{waypointReasonLabel(point.reason)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ color: 'var(--tx3)', textAlign: 'center' }}>
                  Chưa có dữ liệu kế hoạch mission.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Flight summary card ──────────────────────────────────────────────────────

function FlightSummaryCard({ mission }: { mission: OperatorMission }) {
  const route = mission.planSummary?.waypoints ?? []
  const startPoint = route[0]
  const endPoint = route.at(-1)
  const target =
    typeof mission.targetX === 'number' && typeof mission.targetY === 'number'
      ? { simX: mission.targetX, simY: mission.targetY }
      : endPoint

  const routeHighlights = route.filter(
    (_p, i) => i === 0 || i === route.length - 1,
  )
  const intermediateCount = Math.max(0, route.length - 2)

  return (
    <div className="odm-card">
      {/* Card header */}
      <div className="odm-card-header">
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Tóm tắt đường bay</div>
          <div style={{ fontWeight: 400, fontSize: 11.5, color: 'var(--tx3)', marginTop: 1 }}>
            Đường bay được tạo trên bản đồ mô phỏng
          </div>
        </div>
      </div>

      <div className="odm-card-body">
        {/* 2×2 metric grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
          <FlightMetric
            icon="📍"
            label="Số điểm bay"
            value={`${route.length}`}
          />
          <FlightMetric
            icon="📏"
            label="Quãng đường"
            value={formatMeters(mission.planSummary?.plannedDistanceM)}
          />
          <FlightMetric
            icon="⏱"
            label="Thời gian ước tính"
            value={formatSeconds(mission.planSummary?.plannedDurationSec)}
          />
          <FlightMetric
            icon="🔺"
            label="Độ cao dự kiến"
            value={formatMeters(mission.planSummary?.maxPlannedAltitudeM)}
          />
        </div>

        {/* Notes */}
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--tx3)',
            lineHeight: 1.5,
            marginBottom: 14,
            padding: '8px 10px',
            background: 'var(--sf2)',
            borderRadius: 6,
            border: '1px solid var(--bd)',
          }}
        >
          {routeDurationNote(mission.planSummary?.plannedDurationSec)}{' '}
          {altitudeNote(mission.planSummary?.maxPlannedAltitudeM)}
        </div>

        {/* Tọa độ quan trọng */}
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--tx2)' }}>
          Tọa độ quan trọng
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {/* Start point */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr',
              gap: 8,
              alignItems: 'center',
              padding: '10px 12px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1px solid var(--bd)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              H
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                Điểm xuất phát
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
                {startPoint
                  ? `X ${startPoint.simX.toFixed(1)} · Y ${startPoint.simY.toFixed(1)}`
                  : '—'}
                {startPoint?.altitudeM != null && (
                  <span style={{ marginLeft: 8 }}>Độ cao: {startPoint.altitudeM.toFixed(1)} m</span>
                )}
              </div>
            </div>
          </div>

          {/* Target point */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '28px 1fr',
              gap: 8,
              alignItems: 'center',
              padding: '10px 12px',
              borderRadius: 8,
              background: '#fef2f2',
              border: '1px solid rgba(239,68,68,.25)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              T
            </div>
            <div>
              <div style={{ fontSize: 11.5, fontWeight: 700, color: '#b91c1c', marginBottom: 2 }}>
                Điểm giám sát
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
                {target
                  ? `X ${target.simX.toFixed(1)} · Y ${target.simY.toFixed(1)}`
                  : '—'}
                {endPoint?.altitudeM != null && (
                  <span style={{ marginLeft: 8 }}>Độ cao: {endPoint.altitudeM.toFixed(1)} m</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lộ trình bay */}
        <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--tx2)' }}>
          Lộ trình bay
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 200, overflowY: 'auto' }}>
          {routeHighlights.length > 0 ? (
            routeHighlights.map((point, index) => {
              const isTarget = point.reason?.toUpperCase() === 'TARGET'
              return (
                <div key={`route-wrap-${point.id}`} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '44px 1fr',
                      gap: 8,
                      alignItems: 'center',
                      padding: '7px 10px',
                      borderRadius: 7,
                      background: isTarget ? '#fef2f2' : 'var(--sf2)',
                      border: '1px solid var(--bd)',
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: 12,
                        color: isTarget ? '#b91c1c' : 'var(--blue-dot)',
                      }}
                    >
                      WP {point.sequence}
                    </span>
                    <div>
                      <div style={{ fontSize: 11.5, color: 'var(--tx2)' }}>
                        Tọa độ X {point.simX.toFixed(1)} · Y {point.simY.toFixed(1)}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--tx3)' }}>
                        {waypointReasonLabel(point.reason)}
                      </div>
                    </div>
                  </div>
                  {index === 0 && intermediateCount > 0 ? (
                    <div
                      style={{
                        padding: '4px 10px',
                        color: 'var(--tx3)',
                        fontSize: 11.5,
                        textAlign: 'center',
                      }}
                    >
                      ↓ {intermediateCount} điểm trung gian
                    </div>
                  ) : null}
                </div>
              )
            })
          ) : (
            <div style={{ color: 'var(--tx3)', fontSize: 12 }}>Chưa có điểm bay.</div>
          )}
        </div>
      </div>
    </div>
  )
}

function FlightMetric({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid var(--bd)',
        background: 'var(--sf2)',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}
    >
      <span style={{ fontSize: 16, lineHeight: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontWeight: 800, fontSize: 15 }}>{value}</div>
      </div>
    </div>
  )
}

// ─── Mission info card ────────────────────────────────────────────────────────

function MissionInfoCard({ mission }: { mission: OperatorMission }) {
  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>Thông tin mission</span>
        <StatusBadge tone={STATUS_TONE[mission.status]}>{STATUS_LABEL[mission.status]}</StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        <InfoRow icon="📅" label="Ngày bay" value={formatVnDate(mission.date)} />
        <InfoRow icon="⏱" label="Giờ bắt đầu" value={mission.startTime || 'Chưa lên lịch'} />
        <InfoRow icon="📍" label="Địa điểm" value={locationLabel(mission.location)} />
        <InfoRow
          icon="🔵"
          label="Vùng giám sát"
          value={`Bán kính ${mission.radiusMeters == null ? '—' : `${mission.radiusMeters} m`}`}
        />
        <InfoRow icon="📋" label="Loại nhiệm vụ" value={mission.serviceLabel} />

        {/* Description */}
        <div style={{ borderTop: '1px solid var(--bd)', paddingTop: 10, marginTop: 6 }}>
          <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginBottom: 5, fontWeight: 600 }}>
            Mô tả mission
          </div>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.55,
              color: 'var(--tx2)',
              whiteSpace: 'pre-wrap',
              maxHeight: 90,
              overflowY: 'auto',
            }}
          >
            {missionDescriptionText(mission.description)}
          </div>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(104px, auto) minmax(0, 1fr)',
        alignItems: 'start',
        gap: 10,
        padding: '6px 0',
        fontSize: 12.5,
        borderTop: '1px solid var(--bd)',
      }}
    >
      <span style={{ color: 'var(--tx3)', display: 'flex', alignItems: 'center', gap: 5 }}>
        <span style={{ fontSize: 12 }}>{icon}</span>
        {label}
      </span>
      <span style={{ fontWeight: 500, textAlign: 'right', color: 'var(--tx)', minWidth: 0 }}>
        {value}
      </span>
    </div>
  )
}

// ─── Drone device card ────────────────────────────────────────────────────────

function DroneDeviceCard({ mission }: { mission: OperatorMission }) {
  const droneLabel =
    mission.droneName && mission.droneName !== mission.droneCode
      ? `${mission.droneCode} ${mission.droneName}`
      : mission.droneCode ?? 'Chưa gán drone'

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>Thiết bị thực hiện</span>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Drone icon placeholder */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: 'var(--sf2)',
              border: '1px solid var(--bd)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              fontSize: 22,
            }}
          >
            🚁
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{droneLabel}</div>
            {(mission.droneModel || mission.dronePayload) && (
              <div style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 4 }}>
                {[mission.droneModel, mission.dronePayload].filter(Boolean).join(' / ')}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge
                tone={
                  mission.droneReadinessPct != null && mission.droneReadinessPct >= 80
                    ? 'green'
                    : mission.droneReadinessPct != null
                      ? 'yellow'
                      : 'gray'
                }
              >
                {mission.droneReadinessPct == null
                  ? 'Chưa có telemetry'
                  : `${mission.droneReadinessPct}% Sẵn sàng`}
              </StatusBadge>
            </div>
          </div>
        </div>
        {(mission.droneStation || mission.droneHoursSinceMaintenance != null) && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--bd)',
              fontSize: 11.5,
              color: 'var(--tx3)',
            }}
          >
            {mission.droneStation && (
              <span>Lấy tại {mission.droneStation}</span>
            )}
            {mission.droneStation && mission.droneStationDistanceKm != null && (
              <span> · cách {mission.droneStationDistanceKm} km</span>
            )}
            {mission.droneHoursSinceMaintenance != null && (
              <span style={{ display: 'block', marginTop: 2 }}>
                {mission.droneHoursSinceMaintenance} giờ bay từ lần bảo trì
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Precheck card ────────────────────────────────────────────────────────────

function PrecheckCard({ preflight }: { preflight: RuntimePreflightStatus | null }) {
  const [expanded, setExpanded] = useState(false)
  const passCount =
    preflight?.checks.filter((c) => c.status === 'PASS' || c.status === 'WARN').length ?? 0
  const failCount = preflight?.checks.filter((c) => c.status === 'FAIL').length ?? 0
  const PREVIEW_COUNT = 5
  const visibleChecks = preflight
    ? expanded
      ? preflight.checks
      : preflight.checks.slice(0, PREVIEW_COUNT)
    : []
  const hasMore = (preflight?.checks.length ?? 0) > PREVIEW_COUNT

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>Kết quả precheck & thời tiết</span>
        <StatusBadge tone={statusTone(preflight?.status)}>
          {preflightLabel(preflight?.status)}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        {preflight ? (
          <>
            {/* Meta rows */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11.5,
                color: 'var(--tx3)',
                marginBottom: 4,
              }}
            >
              <span># Mã check</span>
              <span
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 10.5,
                  color: 'var(--tx2)',
                  maxWidth: 170,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {preflight.checkId}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11.5,
                color: 'var(--tx3)',
                marginBottom: 10,
              }}
            >
              <span>Tiến độ</span>
              <span style={{ fontWeight: 600, color: 'var(--tx)' }}>
                {Math.round(preflight.progress)}% · {passCount} đạt
                {failCount ? ` · ${failCount} lỗi` : ''}
              </span>
            </div>

            {/* Check items */}
            <div
              style={{
                border: '1px solid var(--bd)',
                borderRadius: 7,
                overflow: 'hidden',
              }}
            >
              {visibleChecks.map((item, idx) => (
                <div
                  key={`${item.key}-${idx}`}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '18px 1fr auto',
                    gap: 6,
                    alignItems: 'center',
                    padding: '7px 10px',
                    borderBottom: idx < visibleChecks.length - 1 ? '1px solid var(--bd)' : 'none',
                    background: item.status === 'FAIL' ? 'var(--red-bg)' : '#fff',
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      color: item.status === 'FAIL' ? 'var(--red-fg)' : 'var(--green-fg)',
                      fontSize: 13,
                    }}
                  >
                    {item.status === 'FAIL' ? '✗' : item.status === 'PASS' || item.status === 'WARN' ? '✓' : '○'}
                  </span>
                  <div>
                    <div style={{ fontWeight: 600, color: item.status === 'FAIL' ? 'var(--red-fg)' : 'var(--tx)' }}>
                      {item.name}
                    </div>
                    {item.message && (
                      <div
                        style={{
                          fontSize: 11,
                          color: item.status === 'FAIL' ? 'var(--red-fg)' : 'var(--tx3)',
                          marginTop: 1,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 140,
                        }}
                      >
                        {item.message}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 11.5,
                      color: item.status === 'FAIL' ? 'var(--red-fg)' : 'var(--green-fg)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {checkLabel(item.status)}
                  </span>
                </div>
              ))}
            </div>

            {hasMore && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                style={{
                  marginTop: 8,
                  width: '100%',
                  padding: '5px 0',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--blue-dot)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                {expanded
                  ? `Thu gọn ↑`
                  : `Xem chi tiết (${preflight.checks.length - PREVIEW_COUNT} thêm) ↓`}
              </button>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
            Chưa có dữ liệu precheck cho mission này.
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Weather card ─────────────────────────────────────────────────────────────

function WeatherCard({ weather }: { weather: WeatherPreflightStatus | null }) {
  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <div>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Thời tiết bay</div>
          {weather && (
            <div style={{ fontSize: 11.5, color: 'var(--tx3)', marginTop: 1 }}>
              {weather.summary}
            </div>
          )}
        </div>
        <StatusBadge tone={statusTone(weather?.status)}>
          {weather ? (weather.safeToFly ? 'An toàn' : weather.status) : 'Chưa check'}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '12px 14px' }}>
        {weather ? (
          <>
            <div className="mds-weather-grid">
              <WeatherTile
                label="Gió / giật"
                value={`${weather.windSpeedMps.toFixed(1)} / ${weather.windGustMps.toFixed(1)} m/s`}
                icon="💨"
              />
              <WeatherTile
                label="Mưa"
                value={`${weather.precipitationMmH.toFixed(1)} mm/h`}
                icon="🌧"
              />
              <WeatherTile
                label="Tầm nhìn"
                value={`${weather.visibilityKm.toFixed(1)} km`}
                icon="👁"
              />
              <WeatherTile
                label="Nhiệt / ẩm"
                value={`${weather.temperatureC.toFixed(1)}°C · ${weather.humidityPercent.toFixed(0)}%`}
                icon="🌡"
              />
            </div>
            {weather.advisories.length > 0 && (
              <div
                style={{
                  marginTop: 10,
                  padding: '7px 10px',
                  borderRadius: 6,
                  background: 'var(--yellow-bg)',
                  color: 'var(--yellow-fg)',
                  fontSize: 12,
                  border: '1px solid var(--yellow-dot)',
                }}
              >
                {weather.advisories.join(' · ')}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: 'var(--tx3)', fontSize: 12.5 }}>
            Chưa có kết quả check thời tiết.
          </div>
        )}
      </div>
    </div>
  )
}

function WeatherTile({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div
      className="mds-weather-tile"
      style={{
        padding: '10px 12px',
        borderRadius: 8,
        border: '1px solid var(--bd)',
        background: 'var(--sf2)',
      }}
    >
      <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 3 }}>{label}</div>
      <div className="mds-weather-value">{value}</div>
    </div>
  )
}

// ─── Postcheck card ───────────────────────────────────────────────────────────

function PostcheckCard({ postflight }: { postflight: PostflightCheckStatus | null }) {
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
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>Kết quả postcheck</span>
        <StatusBadge tone={postflight ? (postflight.overallOk ? 'green' : 'red') : 'gray'}>
          {postflight ? (postflight.overallOk ? 'OK' : 'Cần bảo trì') : 'Chưa postcheck'}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        {postflight ? (
          <>
            {/* Telemetry metrics 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
              <PostMetric label="Check lúc" value={formatCheckedAt(postflight.checkedAt)} />
              <PostMetric label="Độ cao" value={formatNumber(postflight.landingAltitudeM, ' m')} />
              <PostMetric label="Pin hạ cánh" value={formatNumber(postflight.landingBatteryPercent, '%')} />
              <PostMetric label="Tốc độ" value={formatNumber(postflight.landingSpeedMps, ' m/s')} />
              {postflight.landingTelemetryOnline != null && (
                <PostMetric
                  label="Telemetry"
                  value={postflight.landingTelemetryOnline ? 'Online' : 'Offline'}
                />
              )}
              {postflight.landingHeadingDeg != null && (
                <PostMetric label="Heading" value={formatNumber(postflight.landingHeadingDeg, '°', 0)} />
              )}
            </div>

            {/* Component checks grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
              {checks.map(([label, value]) => (
                <div
                  key={String(label)}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 8px',
                    borderRadius: 7,
                    border: '1px solid var(--bd)',
                    background: value === false ? 'var(--red-bg)' : 'var(--sf2)',
                    fontSize: 11.5,
                  }}
                >
                  <span style={{ color: 'var(--tx3)' }}>{label}</span>
                  <span
                    style={{
                      fontWeight: 700,
                      color: value === false ? 'var(--red-fg)' : 'var(--green-fg)',
                    }}
                  >
                    {value === true ? '✓' : value === false ? '✗' : '—'}
                  </span>
                </div>
              ))}
            </div>

            {(issueText || noteText) && (
              <div
                style={{
                  marginTop: 10,
                  padding: '8px 10px',
                  borderRadius: 7,
                  border: `1px solid ${postflight.overallOk ? 'var(--bd)' : 'var(--red-dot)'}`,
                  background: postflight.overallOk ? 'var(--sf2)' : 'var(--red-bg)',
                  color: postflight.overallOk ? 'var(--tx2)' : 'var(--red-fg)',
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                {issueText && <div style={{ fontWeight: 700 }}>{issueText}</div>}
                {noteText && <div style={{ marginTop: issueText ? 3 : 0 }}>{noteText}</div>}
              </div>
            )}
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

function PostMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '7px 9px',
        borderRadius: 7,
        border: '1px solid var(--bd)',
        background: 'var(--sf2)',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>{label}</div>
      <div
        style={{
          fontWeight: 700,
          fontSize: 12.5,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {value}
      </div>
    </div>
  )
}

// ─── Manager note card ────────────────────────────────────────────────────────

function ManagerNoteCard({ mission }: { mission: OperatorMission }) {
  return (
    <div
      className="odm-card"
      style={{ background: 'var(--yellow-bg)', borderColor: 'var(--yellow-dot)' }}
    >
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 5, color: 'var(--yellow-fg)' }}>
          Ghi chú của quản lý · {mission.managerName ?? ''}
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--yellow-fg)', marginBottom: 6 }}>
          {mission.managerNote}
        </div>
        {mission.respondBy && mission.status === 'PENDING' && (
          <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--yellow-fg)' }}>
            Hãy phản hồi trước {formatVnDate(mission.respondBy.slice(0, 10))}{' '}
            {formatHm(mission.respondBy)}
          </div>
        )}
      </div>
    </div>
  )
}
