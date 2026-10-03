import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { EmptyState, LoadingState } from '../../../shared/components/odm/StateView'
import { useI18n } from '../../../shared/i18n'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { HCMC_SERVICE_CENTER } from '../../../shared/lib/serviceArea'
import { env } from '../../../config/env'
import { authenticatedFetch } from '../../auth/api/authApi'
import { missionApi } from '../../mission/api/missionApi'
import { operatorApi } from '../api/operatorApi'
import { setActiveMissionId } from '../api/liveMission'
import { formatDeviceLabel } from '../lib/deviceLabel'
import { operatorHref } from '../routes'
import type { OperatorMission } from '../types/mission'
import { RejectDialog } from './RejectDialog'
import { missionDetailScreenMessages } from './MissionDetailScreen.messages'
import { MissionUploadedMedia } from '../../media/components/MissionUploadedMedia'
import { viCheckMessage, viCheckName } from '../../../shared/lib/checkText'

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

// ─── Types ───────────────────────────────────────────────────────────────────

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
  deviceConnectionId?: string | null
  deviceCode?: string | null
  deviceName?: string | null
  droneCode?: string | null
  checkedBy?: string | null
  status?: string | null
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
  startedAt?: string | null
  completedAt?: string | null
  totalChecks?: number | null
  passedChecks?: number | null
  failedChecks?: number | null
  progressPercent?: number | null
  items?: Array<{
    id?: string | null
    checkType?: string | null
    checkName?: string | null
    status?: 'PASS' | 'WARN' | 'FAIL' | 'PASSED' | 'FAILED' | 'PENDING' | string | null
    checkLevel?: string | null
    message?: string | null
    checkedAt?: string | null
  }>
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

function postflightItemFailed(item: { status?: string | null }) {
  return item.status === 'FAIL' || item.status === 'FAILED'
}

function normalizePostflightItemStatus(status?: string | null) {
  if (status === 'PASSED') return 'PASS'
  if (status === 'FAILED') return 'FAIL'
  if (status === 'PENDING') return 'WARN'
  return status ?? null
}

function hasAnyPostflightType(
  items: Array<{ checkType?: string | null; status?: string | null }>,
  types: string[],
) {
  const relevant = items.filter((item) =>
    types.includes(String(item.checkType ?? '').toUpperCase()),
  )
  if (relevant.length === 0) return null
  return relevant.every((item) => !postflightItemFailed(item))
}

function normalizePostflightStatus(value: unknown): PostflightCheckStatus | null {
  if (!value || typeof value !== 'object') return null
  const candidate = value as Partial<PostflightCheckStatus>
  if (typeof candidate.id !== 'string') return null
  const items = (candidate.items ?? []).map((item) => ({
    ...item,
    status: normalizePostflightItemStatus(item.status),
  }))
  const status = candidate.status
  const overallOk =
    typeof candidate.overallOk === 'boolean'
      ? candidate.overallOk
      : status === 'PASSED'
        ? true
        : status === 'FAILED'
          ? false
          : items.length > 0
            ? items.every((item) => !postflightItemFailed(item))
            : false
  const checkedAt =
    candidate.checkedAt ??
    candidate.completedAt ??
    candidate.startedAt ??
    new Date().toISOString()

  return {
    ...candidate,
    id: candidate.id,
    overallOk,
    checkedAt,
    items,
    batteryOk:
      candidate.batteryOk ?? hasAnyPostflightType(items, ['BATTERY', 'E1', 'E4']),
    motorOk:
      candidate.motorOk ?? hasAnyPostflightType(items, ['PROPELLERS', 'MOTORS', 'P1', 'P2']),
    cameraOk:
      candidate.cameraOk ?? hasAnyPostflightType(items, ['CAMERA', 'E2']),
    gpsOk:
      candidate.gpsOk ?? hasAnyPostflightType(items, ['GPS', 'E3']),
    communicationOk:
      candidate.communicationOk ?? hasAnyPostflightType(items, ['COMMUNICATION', 'D1']),
    physicalConditionOk:
      candidate.physicalConditionOk ?? hasAnyPostflightType(items, ['AIRFRAME', 'A1', 'A2']),
  }
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
    `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}/pre-device-checks/current`,
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
    `${env.apiBaseUrl}/api/weather/pre-device-checks/latest?missionId=${encodeURIComponent(missionId)}`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const weather = payload?.data ?? payload
  return isWeatherStatus(weather) ? weather : null
}

async function fetchLatestPostflightCheck(missionId: string, signal?: AbortSignal) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}/post-device-checks/current`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const postflight = payload?.data ?? payload
  const normalized = normalizePostflightStatus(postflight)
  return normalized && isPostflightStatus(normalized) ? normalized : null
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
  if (status === 'READY') return 'Đã đạt'
  if (status === 'FAILED') return 'Không đạt'
  if (status === 'CHECKING') return 'Đang kiểm'
  return 'Chưa kiểm'
}

function checkLabel(status: RuntimeStatus) {
  if (status === 'PASS') return 'Đạt'
  if (status === 'WARN') return 'Cảnh báo'
  if (status === 'FAIL') return 'Không đạt'
  if (status === 'CHECKING') return 'Đang kiểm'
  return 'Chờ kiểm'
}

function inspectionLabel(status?: string | null) {
  if (status === 'PASS') return 'Đạt'
  if (status === 'WARN') return 'Cảnh báo'
  if (status === 'FAIL') return 'Không đạt'
  return 'Chưa rõ'
}

const PREFLIGHT_NAME_LABELS: Record<string, string> = {
  BACKEND: 'Kết nối backend',
  BATTERY: 'Pin',
  CAMERA: 'Camera dưới',
  GAZEBO: 'Mô phỏng Gazebo',
  LIDAR: 'Cảm biến LiDAR',
  LOCAL_POSITION: 'Vị trí cục bộ',
  MAVSDK: 'Kết nối MAVSDK',
  MAVSDK_HEALTH: 'Sức khỏe MAVSDK',
  MEDIA: 'Tải media',
  MODULES: 'Kiểm tra module',
  PX4: 'Bộ điều khiển bay PX4',
  PX4_CONTROL: 'Điều khiển PX4',
}

const PREFLIGHT_NAME_FALLBACKS: Record<string, string> = {
  'Backend Connection': 'Kết nối backend',
  Battery: 'Pin',
  'Downward Camera': 'Camera dưới',
  'Gazebo Simulation': 'Mô phỏng Gazebo',
  LiDAR: 'Cảm biến LiDAR',
  'Local Position': 'Vị trí cục bộ',
  'MAVSDK Connection': 'Kết nối MAVSDK',
  'MAVSDK Health': 'Sức khỏe MAVSDK',
  'Media Upload': 'Tải media',
  'Module Check': 'Kiểm tra module',
  'PX4 Control': 'Điều khiển PX4',
  'PX4 Flight Controller': 'Bộ điều khiển bay PX4',
}

function preflightCheckName(item: RuntimeCheck) {
  return PREFLIGHT_NAME_LABELS[item.key] ?? PREFLIGHT_NAME_FALLBACKS[item.name] ?? item.name
}

function preflightMessageLabel(message: string) {
  const text = message.trim()
  if (!text) return ''

  const lower = text.toLowerCase()
  if (lower.includes('required components')) return 'Đã tải đủ thành phần cần thiết'
  if (lower.includes('fresh scan received')) return 'Đã nhận dữ liệu quét mới'
  if (lower.includes('ready for takeoff')) return 'Sẵn sàng cất cánh'
  if (lower.includes('camera frames received')) return 'Đã nhận khung hình camera'
  if (lower.includes('sufficient for operation')) return text.replace('sufficient for operation', 'đủ để vận hành')
  if (lower.includes('ready to fly')) return 'Sẵn sàng bay'
  if (lower.includes('px4 health ready')) return 'Trạng thái PX4 sẵn sàng'
  if (lower.includes('drone model loaded')) return 'Đã tải mô hình drone'
  if (lower.includes('media capture pipeline ready')) return 'Luồng ghi media đã sẵn sàng'
  if (lower.includes('px4 discovered')) return 'Đã phát hiện PX4'
  if (lower.includes('flight controller')) return 'Bộ điều khiển bay đã sẵn sàng'
  if (lower.includes('heartbeat not available')) return 'Chưa nhận được heartbeat'
  if (lower.includes('too low for safe mission start')) return text.replace('too low for safe mission start', 'quá thấp để bắt đầu an toàn')
  if (lower === 'pending') return 'Đang chờ'
  if (lower.includes('waiting for flight controller api')) return 'Đang chờ API bộ điều khiển bay'

  return text
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

function actionErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function MissionDetailScreen({ missionId }: { missionId: string }) {
  const { t } = useI18n(missionDetailScreenMessages)
  const query = useApiQuery((signal) => operatorApi.getMission(missionId, signal), [missionId])
  const [showReject, setShowReject] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultSubmitting, setResultSubmitting] = useState(false)
  const [resultSubmitted, setResultSubmitted] = useState(false)
  const [persistedResultSubmitted, setPersistedResultSubmitted] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)

  useEffect(() => { setActiveMissionId(missionId) }, [missionId])

  useEffect(() => {
    const mission = query.data
    if (!mission) return
    if (mission.status !== 'COMPLETED') {
      setPersistedResultSubmitted(false)
      return
    }

    let active = true
    missionApi
      .getMissionResult(mission.id)
      .then((result) => {
        if (!active) return
        setPersistedResultSubmitted(
          result?.approvalStatus === 'PENDING_MANAGER_APPROVAL' ||
            result?.approvalStatus === 'APPROVED',
        )
      })
      .catch(() => {
        if (active) setPersistedResultSubmitted(false)
      })

    return () => {
      active = false
    }
  }, [query.data])

  if (query.loading) return <LoadingState />
  if (query.error || !query.data) {
    return (
      <EmptyState
        title={t.errorTitle}
        description={t.errorDescription}
        action={
          <a className="odm-btn odm-btn-p" href={operatorHref({ screen: 'missions' })}>
            {t.backToList}
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
    } catch (error) {
      setActionError(actionErrorMessage(error, 'Không thể chấp nhận mission. Vui lòng thử lại.'))
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
    } catch (error) {
      setActionError(actionErrorMessage(error, 'Không thể từ chối mission. Vui lòng thử lại.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitResult() {
    setResultSubmitting(true)
    setActionError(null)
    setResultMessage(null)
    try {
      await missionApi.submitMissionResult(mission.id, {
        status: 'COMPLETED',
        startedAt: mission.flightStartedAt ?? null,
        endedAt: mission.completedAt ?? null,
        completedAt: mission.completedAt ?? new Date().toISOString(),
        summary: [
          `Mission ${mission.missionCode ?? mission.id} đã hoàn thành.`,
          `Dịch vụ: ${mission.serviceLabel || 'Chưa rõ'}.`,
          `Địa điểm: ${mission.location || 'Chưa rõ'}.`,
          `Quãng đường: ${formatMeters(mission.planSummary?.plannedDistanceM)}.`,
          `Thời lượng dự kiến: ${formatSeconds(mission.planSummary?.plannedDurationSec)}.`,
          `Waypoint: ${mission.planSummary?.waypointCount ?? mission.planSummary?.waypoints.length ?? 0}.`,
        ].join(' '),
        notes: 'Kết quả mission được gửi từ phi công để manager duyệt.',
      })
      setResultSubmitted(true)
      setPersistedResultSubmitted(true)
      setResultMessage('Đã gửi kết quả mission cho manager duyệt.')
    } catch (error) {
      setActionError(actionErrorMessage(error, 'Không thể gửi kết quả cho manager. Vui lòng thử lại.'))
    } finally {
      setResultSubmitting(false)
    }
  }

  return (
    <>
      <MissionDashboard
        mission={mission}
        submitting={submitting}
        actionError={actionError}
        resultSubmitting={resultSubmitting}
        resultSubmitted={resultSubmitted || persistedResultSubmitted}
        resultMessage={resultMessage}
        onAccept={handleAccept}
        onOpenReject={() => setShowReject(true)}
        onSubmitResult={handleSubmitResult}
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
  resultSubmitting,
  resultSubmitted,
  resultMessage,
  onAccept,
  onOpenReject,
  onSubmitResult,
}: {
  mission: OperatorMission
  submitting: boolean
  actionError: string | null
  resultSubmitting: boolean
  resultSubmitted: boolean
  resultMessage: string | null
  onAccept: () => void
  onOpenReject: () => void
  onSubmitResult: () => void
}) {
  const deviceId = mission.deviceId
  const [preflightStatus, setPreflightStatus] = useState<RuntimePreflightStatus | null>(() =>
    readStoredPreflightState(mission.id, deviceId),
  )
  const [weatherStatus, setWeatherStatus] = useState<WeatherPreflightStatus | null>(() =>
    readStoredWeatherState(mission.id, deviceId),
  )
  const [postflightStatus, setPostflightStatus] = useState<PostflightCheckStatus | null>(null)
  const [tab, setTab] = useState<'overview' | 'checks' | 'media'>('overview')
  const tabs: Array<{ id: 'overview' | 'checks' | 'media'; label: string }> = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'checks', label: 'Kiểm tra' },
    ...(mission.status === 'COMPLETED'
      ? [{ id: 'media' as const, label: 'Ảnh & video' }]
      : []),
  ]

  useEffect(() => {
    setPreflightStatus(readStoredPreflightState(mission.id, deviceId))
    setWeatherStatus(readStoredWeatherState(mission.id, deviceId))
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
  }, [deviceId, mission.id])

  return (
    <div>
      {/* ── Header ── */}
      <MissionHeader
        mission={mission}
        submitting={submitting}
        resultSubmitting={resultSubmitting}
        resultSubmitted={resultSubmitted}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
        onSubmitResult={onSubmitResult}
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

      {resultMessage ? (
        <div
          style={{
            marginBottom: 12,
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--green-bg)',
            color: 'var(--green-fg)',
            border: '1px solid var(--green-dot)',
            fontSize: 13,
          }}
        >
          {resultMessage}
        </div>
      ) : null}

      <div className="mds-tabs" role="tablist">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`mds-tab${tab === t.id ? ' is-active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="mds-tab-grid">
          <div className="mds-col">
            <MissionMapCard mission={mission} />
            {mission.status === 'PENDING' ? null : <WaypointTableCard mission={mission} />}
          </div>
          <div className="mds-col mds-sticky-col">
            <MissionInfoCard mission={mission} />
            {mission.status === 'PENDING' ? null : <FlightSummaryCard mission={mission} />}
            <DroneDeviceCard mission={mission} />
            {mission.managerNote ? <ManagerNoteCard mission={mission} /> : null}
          </div>
        </div>
      ) : null}

      {tab === 'checks' ? (
        <div className="mds-tab-grid">
          <div className="mds-col">
            <PrecheckCard preflight={preflightStatus} />
            <WeatherCard weather={weatherStatus} />
          </div>
          <div className="mds-col">
            <PostcheckCard postflight={postflightStatus} />
          </div>
        </div>
      ) : null}

      {tab === 'media' && mission.status === 'COMPLETED' ? (
        <MissionUploadedMedia missionId={mission.id} />
      ) : null}
    </div>
  )
}

// ─── Mission Header ───────────────────────────────────────────────────────────

function MissionHeader({
  mission,
  submitting,
  resultSubmitting,
  resultSubmitted,
  onAccept,
  onOpenReject,
  onSubmitResult,
}: {
  mission: OperatorMission
  submitting: boolean
  resultSubmitting: boolean
  resultSubmitted: boolean
  onAccept: () => void
  onOpenReject: () => void
  onSubmitResult: () => void
}) {
  const hasAccepted = mission.myResponseStatus === 'ACCEPTED'
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
        {mission.status === 'PENDING' && hasAccepted ? (
          <StatusBadge tone="green">Bạn đã chấp nhận</StatusBadge>
        ) : mission.status === 'PENDING' ? (
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
        ) : mission.status === 'COMPLETED' ? (
          <>
            {resultSubmitted ? <StatusBadge tone="green">Đã gửi manager</StatusBadge> : null}
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={onSubmitResult}
              disabled={resultSubmitting || resultSubmitted}
            >
              {resultSubmitting
                ? 'Đang gửi...'
                : resultSubmitted
                  ? 'Đã gửi manager'
                  : 'Gửi manager duyệt'}
            </button>
          </>
        ) : null}
      </div>

    </div>
  )
}

// ─── Map card ─────────────────────────────────────────────────────────────────

function validGps(point: { latitude: number; longitude: number } | null) {
  return (
    point !== null &&
    Number.isFinite(point.latitude) &&
    Number.isFinite(point.longitude) &&
    Math.abs(point.latitude) <= 90 &&
    Math.abs(point.longitude) <= 180 &&
    (point.latitude !== 0 || point.longitude !== 0)
  )
}

function legacySimulationToGps(simX: number, simY: number) {
  const latitude = HCMC_SERVICE_CENTER.latitude + simY / 111_320
  const longitude =
    HCMC_SERVICE_CENTER.longitude +
    simX /
      (111_320 * Math.cos((HCMC_SERVICE_CENTER.latitude * Math.PI) / 180))
  return {
    latitude: Number(latitude.toFixed(7)),
    longitude: Number(longitude.toFixed(7)),
  }
}

function missionTargetGps(mission: OperatorMission) {
  const direct = {
    latitude: mission.latitude ?? Number.NaN,
    longitude: mission.longitude ?? Number.NaN,
  }
  if (validGps(direct)) return direct

  const fromTarget = {
    latitude: mission.targetY ?? Number.NaN,
    longitude: mission.targetX ?? Number.NaN,
  }
  if (validGps(fromTarget)) return fromTarget

  if (
    typeof mission.targetX === 'number' &&
    typeof mission.targetY === 'number'
  ) {
    return legacySimulationToGps(mission.targetX, mission.targetY)
  }

  const routeTarget = mission.planSummary?.waypoints.at(-1)
  return routeTarget
    ? legacySimulationToGps(routeTarget.simX, routeTarget.simY)
    : null
}

function useOperatorMissionMap(mission: OperatorMission) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const circle = useRef<L.Circle | null>(null)
  const target = missionTargetGps(mission)
  const targetLat = target?.latitude
  const targetLon = target?.longitude

  useEffect(() => {
    if (import.meta.env.MODE === 'test') return
    if (!container.current || map.current) return
    const initialCenter: L.LatLngExpression = target
      ? [target.latitude, target.longitude]
      : [HCMC_SERVICE_CENTER.latitude, HCMC_SERVICE_CENTER.longitude]
    const instance = L.map(container.current, {
      zoomControl: true,
      attributionControl: true,
    }).setView(initialCenter, target ? 16 : 11)

    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        maxZoom: 19,
        attribution: 'Tiles &copy; Esri',
        crossOrigin: true,
      },
    ).addTo(instance)

    map.current = instance
    window.setTimeout(() => instance.invalidateSize(), 0)
    return () => {
      instance.remove()
      map.current = null
      marker.current = null
      circle.current = null
    }
  }, [targetLat, targetLon])

  useEffect(() => {
    if (!map.current || !target) return
    const point: L.LatLngExpression = [target.latitude, target.longitude]
    if (marker.current) {
      marker.current.setLatLng(point)
    } else {
      marker.current = L.marker(point)
        .addTo(map.current)
        .bindTooltip('Điểm giám sát')
    }

    if (mission.radiusMeters && mission.radiusMeters > 0) {
      if (circle.current) {
        circle.current.setLatLng(point).setRadius(mission.radiusMeters)
      } else {
        circle.current = L.circle(point, {
          radius: mission.radiusMeters,
          color: '#16a34a',
          fillColor: '#22c55e',
          fillOpacity: 0.16,
          weight: 2,
        }).addTo(map.current)
      }
    } else if (circle.current) {
      circle.current.remove()
      circle.current = null
    }

    map.current.setView(point, 16)
  }, [targetLat, targetLon, mission.radiusMeters])

  return { container, target }
}

function MissionMapCard({ mission }: { mission: OperatorMission }) {
  const { container, target } = useOperatorMissionMap(mission)

  return (
    <div className="odm-card" style={{ overflow: 'hidden' }}>
      <div
        className="mds-map-viewport"
        style={{ position: 'relative', background: '#111827', overflow: 'hidden' }}
      >
        <div
          ref={container}
          style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          role="application"
          aria-label="Bản đồ vệ tinh mission"
        />

        {target ? (
          <div
            style={{
              position: 'absolute',
              right: 10,
              top: 10,
              padding: '7px 10px',
              borderRadius: 8,
              background: 'rgba(254,242,242,.94)',
              color: '#991b1b',
              border: '1px solid rgba(239,68,68,.35)',
              fontSize: 11.5,
              fontWeight: 700,
              boxShadow: '0 2px 10px rgba(15,23,42,.10)',
              zIndex: 500,
            }}
          >
            ĐIỂM GIÁM SÁT · {target.latitude.toFixed(6)},{' '}
            {target.longitude.toFixed(6)}
          </div>
        ) : null}

        {mission.radiusMeters ? (
          <div
            style={{
              position: 'absolute',
              left: 10,
              bottom: 10,
              padding: '8px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,.94)',
              color: 'var(--tx)',
              fontSize: 12,
              fontWeight: 700,
              boxShadow: '0 2px 10px rgba(15,23,42,.12)',
              zIndex: 500,
            }}
          >
            Bán kính giám sát: {Math.round(mission.radiusMeters)} m
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

// ─── Device card ──────────────────────────────────────────────────────────────

function DroneDeviceCard({ mission }: { mission: OperatorMission }) {
  const droneLabel = formatDeviceLabel(mission) ?? 'Chưa gán thiết bị'

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>Thiết bị thực hiện</span>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Device icon placeholder */}
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
        <span style={{ fontWeight: 700 }}>Kết quả precheck</span>
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
              {visibleChecks.map((item, idx) => {
                const message = preflightMessageLabel(item.message)
                return (
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
                        {preflightCheckName(item)}
                      </div>
                      {message && (
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
                          title={message}
                        >
                          {message}
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
                )
              })}
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
  const itemChecks = postflight?.items?.filter((item) => item.checkName || item.checkType) ?? []
  const checks: Array<[string, boolean | null | undefined]> = [
    ['Thân vỏ', postflight?.physicalConditionOk],
    ['Động cơ', postflight?.motorOk],
    ['Pin', postflight?.batteryOk],
    ['Camera', postflight?.cameraOk],
    ['Định vị', postflight?.gpsOk],
    ['Kết nối', postflight?.communicationOk],
  ]

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>Kết quả postcheck</span>
        <StatusBadge tone={postflight ? (postflight.overallOk ? 'green' : 'red') : 'gray'}>
          {postflight ? (postflight.overallOk ? 'Đạt' : 'Cần bảo trì') : 'Chưa postcheck'}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        {postflight ? (
          <>
            {/* Telemetry metrics 2×2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
              <PostMetric label="Kiểm tra lúc" value={formatCheckedAt(postflight.checkedAt)} />
              <PostMetric label="Độ cao" value={formatNumber(postflight.landingAltitudeM, ' m')} />
              <PostMetric label="Pin hạ cánh" value={formatNumber(postflight.landingBatteryPercent, '%')} />
              <PostMetric label="Tốc độ" value={formatNumber(postflight.landingSpeedMps, ' m/s')} />
              {postflight.landingTelemetryOnline != null && (
                <PostMetric
                  label="Telemetry"
                  value={postflight.landingTelemetryOnline ? 'Trực tuyến' : 'Mất kết nối'}
                />
              )}
              {postflight.landingHeadingDeg != null && (
                <PostMetric label="Heading" value={formatNumber(postflight.landingHeadingDeg, '°', 0)} />
              )}
            </div>

            {itemChecks.length > 0 ? (
              <div
                style={{
                  border: '1px solid var(--bd)',
                  borderRadius: 7,
                  overflow: 'hidden',
                }}
              >
                {itemChecks.map((item, idx) => {
                  const isFail = item.status === 'FAIL'
                  const isWarn = item.status === 'WARN'
                  return (
                    <div
                      key={item.id ?? `${item.checkType}-${idx}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '18px 1fr auto',
                        gap: 6,
                        alignItems: 'center',
                        padding: '7px 10px',
                        borderBottom: idx < itemChecks.length - 1 ? '1px solid var(--bd)' : 'none',
                        background: isFail ? 'var(--red-bg)' : '#fff',
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          color: isFail ? 'var(--red-fg)' : isWarn ? 'var(--yellow-fg)' : 'var(--green-fg)',
                          fontSize: 13,
                        }}
                      >
                        {isFail ? '✗' : isWarn ? '!' : '✓'}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: isFail ? 'var(--red-fg)' : 'var(--tx)' }}>
                          {viCheckName(item.checkName ?? item.checkType)}
                        </div>
                        {item.message && (
                          <div
                            style={{
                              fontSize: 11,
                              color: isFail ? 'var(--red-fg)' : 'var(--tx3)',
                              marginTop: 1,
                              lineHeight: 1.35,
                            }}
                          >
                            {viCheckMessage(item.message)}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 11.5,
                          color: isFail ? 'var(--red-fg)' : isWarn ? 'var(--yellow-fg)' : 'var(--green-fg)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {inspectionLabel(item.status)}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
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
            )}

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
