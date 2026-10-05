import { useEffect, useRef, useState, type ReactNode } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { missionStatusTone } from '../../../shared/lib/statusTone'
import {
  EmptyState,
  LoadingState,
} from '../../../shared/components/odm/StateView'
import { useI18n } from '../../../shared/i18n'
import { useApiQuery } from '../../../shared/hooks/useApiQuery'
import { HCMC_SERVICE_CENTER } from '../../../shared/lib/serviceArea'
import { env } from '../../../config/env'
import { authenticatedFetch } from '../../auth/api/authApi'
import { missionApi } from '../../mission/api/missionApi'
import { useMissionMonitoring } from '../../mission/hooks/useMissionMonitoring'
import { MonitoringChecklistSection, monitoringErrorMessage } from '../../mission/components/MonitoringChecklistSection'
import type { MissionResultApprovalStatus } from '../../mission/types/mission'
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
  ...missionStatusTone,
  UNKNOWN: 'gray',
  PENDING: 'gray',
  ACCEPTED: 'green',
  IN_FLIGHT: 'blue',
  COMPLETED: 'green',
  REJECTED: 'red',
  FAILED: 'red',
} as const

const STATUS_LABEL: Record<string, string> = {
  PENDING_REVIEW: 'Chờ nghiệm thu',
  UNKNOWN: 'Trạng thái chưa hỗ trợ',
  PENDING: 'Chờ phản hồi',
  ACCEPTED: 'Đã nhận',
  IN_FLIGHT: 'Đang bay',
  COMPLETED: 'Hoàn thành',
  REJECTED: 'Bị từ chối',
  FAILED: 'Không hoàn thành',
}

const GCS_CONNECTED_STATUSES = new Set([
  'PENDING_REVIEW',
  'CONNECTED',
  'PREFLIGHT_CHECKING',
  'READY_TO_FLY',
  'IN_FLIGHT',
  'IN_PROGRESS',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'COMPLETED',
])

const INSPECTION_MEDIA_STATUSES = new Set([
  'PENDING_REVIEW',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'COMPLETED',
])

function missionProgressBadge(status?: string | null) {
  if (status === 'CONNECTED') {
    return { tone: 'blue' as const, label: 'Quy trình: đã kết nối GCS' }
  }
  if (status === 'PREFLIGHT_CHECKING') {
    return { tone: 'blue' as const, label: 'Quy trình: đang preflight' }
  }
  if (status === 'READY_TO_FLY') {
    return { tone: 'green' as const, label: 'Quy trình: sẵn sàng bàn giao' }
  }
  return null
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
    status?:
      'PASS' | 'WARN' | 'FAIL' | 'PASSED' | 'FAILED' | 'PENDING' | string | null
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

function normalizePostflightStatus(
  value: unknown,
): PostflightCheckStatus | null {
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
      candidate.batteryOk ??
      hasAnyPostflightType(items, ['BATTERY', 'E1', 'E4']),
    motorOk:
      candidate.motorOk ??
      hasAnyPostflightType(items, ['PROPELLERS', 'MOTORS', 'P1', 'P2']),
    cameraOk:
      candidate.cameraOk ?? hasAnyPostflightType(items, ['CAMERA', 'E2']),
    gpsOk: candidate.gpsOk ?? hasAnyPostflightType(items, ['GPS', 'E3']),
    communicationOk:
      candidate.communicationOk ??
      hasAnyPostflightType(items, ['COMMUNICATION', 'D1']),
    physicalConditionOk:
      candidate.physicalConditionOk ??
      hasAnyPostflightType(items, ['AIRFRAME', 'A1', 'A2']),
  }
}

function readStoredPreflightState(
  missionId: string,
  droneLabel?: string | null,
) {
  if (!droneLabel) return null
  try {
    const raw = window.localStorage.getItem(
      preflightStateStorageKey(missionId, droneLabel),
    )
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
    const raw = window.localStorage.getItem(
      weatherStateStorageKey(missionId, droneLabel),
    )
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

async function fetchPersistedPreflight(
  missionId: string,
  signal?: AbortSignal,
) {
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

async function fetchLatestWeatherCheck(
  missionId: string,
  signal?: AbortSignal,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/weather/pre-device-checks/latest?missionId=${encodeURIComponent(missionId)}`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const weather = payload?.data ?? payload
  return isWeatherStatus(weather) ? weather : null
}

async function fetchLatestPostflightCheck(
  missionId: string,
  signal?: AbortSignal,
) {
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
  const weekdays = [
    'Chủ Nhật',
    'Thứ Hai',
    'Thứ Ba',
    'Thứ Tư',
    'Thứ Năm',
    'Thứ Sáu',
    'Thứ Bảy',
  ]
  return `${weekdays[d.getDay()]}, ${d.toLocaleDateString('vi-VN')}`
}

function formatHm(iso: string): string {
  const m = /T(\d{2}):(\d{2})/.exec(iso)
  return m ? `${m[1]}:${m[2]}` : ''
}

function dash(value?: string | number | null): string {
  if (value == null || value === '') return '—'
  return String(value)
}

function formatCoord(value?: number | null): string {
  return typeof value === 'number' && Number.isFinite(value)
    ? value.toFixed(6)
    : '—'
}

function missionDescriptionText(description: string | undefined): string {
  const text = description?.trim() ?? ''
  const lower = text.toLowerCase()
  if (
    !text ||
    text.length < 2 ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'none'
  ) {
    return 'Chưa có mô tả'
  }
  return text
}

function locationLabel(value: string): string {
  if (value === 'Construction Site') return 'Công trường'
  if (value === 'Dam') return 'Đập nước / hồ chứa'
  if (value === 'Warehouse') return 'Kho bãi'
  return value || 'Chưa có địa điểm'
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
  return (
    PREFLIGHT_NAME_LABELS[item.key] ??
    PREFLIGHT_NAME_FALLBACKS[item.name] ??
    item.name
  )
}

function preflightMessageLabel(message: string) {
  const text = message.trim()
  if (!text) return ''

  const lower = text.toLowerCase()
  if (lower.includes('required components'))
    return 'Đã tải đủ thành phần cần thiết'
  if (lower.includes('fresh scan received')) return 'Đã nhận dữ liệu quét mới'
  if (lower.includes('ready for takeoff')) return 'Sẵn sàng cất cánh'
  if (lower.includes('camera frames received'))
    return 'Đã nhận khung hình camera'
  if (lower.includes('sufficient for operation'))
    return text.replace('sufficient for operation', 'đủ để vận hành')
  if (lower.includes('ready to fly')) return 'Sẵn sàng bay'
  if (lower.includes('px4 health ready')) return 'Trạng thái PX4 sẵn sàng'
  if (lower.includes('drone model loaded')) return 'Đã tải mô hình drone'
  if (lower.includes('media capture pipeline ready'))
    return 'Luồng ghi media đã sẵn sàng'
  if (lower.includes('px4 discovered')) return 'Đã phát hiện PX4'
  if (lower.includes('flight controller'))
    return 'Bộ điều khiển bay đã sẵn sàng'
  if (lower.includes('heartbeat not available'))
    return 'Chưa nhận được heartbeat'
  if (lower.includes('too low for safe mission start'))
    return text.replace(
      'too low for safe mission start',
      'quá thấp để bắt đầu an toàn',
    )
  if (lower === 'pending') return 'Đang chờ'
  if (lower.includes('waiting for flight controller api'))
    return 'Đang chờ API bộ điều khiển bay'

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
  return error instanceof Error && error.message ? monitoringErrorMessage(error) : fallback
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export function MissionDetailScreen({ missionId }: { missionId: string }) {
  const { t } = useI18n(missionDetailScreenMessages)
  const query = useApiQuery(
    (signal) => operatorApi.getMission(missionId, signal),
    [missionId],
  )
  const [showReject, setShowReject] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [resultSubmitting, setResultSubmitting] = useState(false)
  const monitoring = useMissionMonitoring(missionId, query.data)
  const resultApprovalStatus = monitoring.data?.result?.approvalStatus ?? null
  const resultSubmitted = resultApprovalStatus === 'PENDING_MANAGER_APPROVAL' || resultApprovalStatus === 'APPROVED'
  const monitoringKnown = !monitoring.loading && !monitoring.error && Boolean(monitoring.data)
  const submitReady = monitoringKnown && monitoring.data?.checklist.readyForSubmission === true && monitoring.data.permissions.canSubmitMissionResult === true && !resultSubmitted
  const [actionError, setActionError] = useState<string | null>(null)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  useEffect(() => { if (resultApprovalStatus === 'REJECTED') setResultMessage(null) }, [resultApprovalStatus])

  useEffect(() => {
    setActiveMissionId(missionId)
  }, [missionId])

  if (query.loading) return <LoadingState />
  if (query.error || !query.data) {
    return (
      <EmptyState
        title={t.errorTitle}
        description={t.errorDescription}
        action={
          <a
            className="odm-btn odm-btn-p"
            href={operatorHref({ screen: 'missions' })}
          >
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
      setActionError(
        actionErrorMessage(
          error,
          'Không thể chấp nhận mission. Vui lòng thử lại.',
        ),
      )
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
      setActionError(
        actionErrorMessage(
          error,
          'Không thể từ chối mission. Vui lòng thử lại.',
        ),
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handleCompleteMission() {
    if (!monitoringKnown || monitoring.data?.checklist.readyForMissionCompletion !== true) return
    setSubmitting(true)
    setActionError(null)
    try {
      await missionApi.completeMission(mission.id)
      query.reload()
      monitoring.reload()
    } catch (error) {
      setActionError(actionErrorMessage(error, 'Không thể nghiệm thu mission.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitResult() {
    if (!submitReady || resultSubmitting) return
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
          `Ngày bay: ${formatVnDate(mission.date)}.`,
          `Vùng giám sát: ${mission.radiusMeters == null ? 'chưa rõ bán kính' : `bán kính ${mission.radiusMeters} m`}.`,
        ].join(' '),
        notes: 'Kết quả giám sát được gửi cho manager duyệt.',
      })
      monitoring.reload()
      query.reload()
      setResultMessage('Đã gửi kết quả mission cho manager duyệt.')
    } catch (error) {
      monitoring.reload()
      setActionError(
        actionErrorMessage(
          error,
          'Không thể gửi kết quả cho manager. Vui lòng thử lại.',
        ),
      )
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
        resultSubmitted={resultSubmitted}
        submitReady={submitReady}
        completeReady={monitoringKnown && monitoring.data?.checklist.readyForMissionCompletion === true}
        monitoringSection={<MonitoringChecklistSection missionId={mission.id} data={monitoring.data?.checklist} loading={monitoring.loading} error={monitoring.error} canExecute={monitoring.data?.permissions.canExecuteMonitoringChecklist} canAttach={monitoring.data?.permissions.canAttachChecklistEvidence} canDetach={monitoring.data?.permissions.canDetachChecklistEvidence} resultStatus={resultApprovalStatus} resultNote={monitoring.data?.result?.reviewNote} resultKnown={monitoringKnown} refresh={monitoring.reload} />}
        resultApprovalStatus={resultApprovalStatus}
        resultMessage={resultMessage}
        onAccept={handleAccept}
        onOpenReject={() => setShowReject(true)}
        onSubmitResult={handleSubmitResult}
        onCompleteMission={handleCompleteMission}
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
  submitReady,
  monitoringSection,
  completeReady,
  resultApprovalStatus,
  resultMessage,
  onAccept,
  onOpenReject,
  onSubmitResult,
  onCompleteMission,
}: {
  mission: OperatorMission
  submitting: boolean
  actionError: string | null
  resultSubmitting: boolean
  resultSubmitted: boolean
  submitReady: boolean
  monitoringSection: ReactNode
  completeReady: boolean
  resultApprovalStatus: MissionResultApprovalStatus | null
  resultMessage: string | null
  onAccept: () => void
  onOpenReject: () => void
  onSubmitResult: () => void
  onCompleteMission: () => void
}) {
  const deviceId = mission.deviceId
  const [preflightStatus, setPreflightStatus] =
    useState<RuntimePreflightStatus | null>(() =>
      readStoredPreflightState(mission.id, deviceId),
    )
  const [weatherStatus, setWeatherStatus] =
    useState<WeatherPreflightStatus | null>(() =>
      readStoredWeatherState(mission.id, deviceId),
    )
  const [postflightStatus, setPostflightStatus] =
    useState<PostflightCheckStatus | null>(null)
  const [tab, setTab] = useState<'overview' | 'checks' | 'media'>('overview')
  const tabs: Array<{ id: 'overview' | 'checks' | 'media'; label: string }> = [
    { id: 'overview', label: 'Tổng quan' },
    { id: 'checks', label: 'Kiểm tra' },
    ...(mission.status === 'COMPLETED' || mission.backendStatus === 'PENDING_REVIEW'
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
        completeReady={completeReady}
        mission={mission}
        submitting={submitting}
        resultSubmitting={resultSubmitting}
        resultSubmitted={resultSubmitted}
        submitReady={submitReady}
        onAccept={onAccept}
        onOpenReject={onOpenReject}
        onSubmitResult={onSubmitResult}
        onCompleteMission={onCompleteMission}
      />

      {monitoringSection}
      {mission.status === 'COMPLETED' && !resultSubmitted && !submitReady && <p role="status">Chưa thể gửi: hãy hoàn thiện checklist và tải lại trạng thái/quyền trước khi gửi kết quả.</p>}

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
          </div>
          <div className="mds-col mds-sticky-col">
            <MissionInfoCard mission={mission} />
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

      {tab === 'media' && (mission.status === 'COMPLETED' || mission.backendStatus === 'PENDING_REVIEW') ? (
        <MissionUploadedMedia
          missionId={mission.id}
          reviewStatus={resultApprovalStatus}
        />
      ) : null}
    </div>
  )
}

// ─── Mission Header ───────────────────────────────────────────────────────────

function MissionHeader({
  completeReady,
  mission,
  submitting,
  resultSubmitting,
  resultSubmitted,
  submitReady,
  onAccept,
  onOpenReject,
  onSubmitResult,
  onCompleteMission,
}: {
  completeReady: boolean
  mission: OperatorMission
  submitting: boolean
  resultSubmitting: boolean
  resultSubmitted: boolean
  submitReady: boolean
  onAccept: () => void
  onOpenReject: () => void
  onSubmitResult: () => void
  onCompleteMission: () => void
}) {
  // Completion readiness comes from the same backend checklist query shown on this page.
  const permissions = useApiQuery(
    () => missionApi.getPermissions(mission.id),
    [mission.id, mission.status, mission.backendStatus, mission.myResponseStatus],
  )
  const access =
    !permissions.loading && !permissions.error ? permissions.data : undefined
  const hasAccepted = mission.myResponseStatus === 'ACCEPTED'
  const progressBadge = missionProgressBadge(mission.backendStatus)
  const canHandleInspectionMedia =
    access?.canUploadMedia === true &&
    (access?.canInspectDevice === true ||
      INSPECTION_MEDIA_STATUSES.has(mission.backendStatus ?? ''))
  const showProgressBadge =
    progressBadge &&
    !(access?.canInspectDevice === true || access?.canUploadMedia === true)
  return (
    <div className="mds-header">
      {/* Row 1: code + badge + actions */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 6,
        }}
      >
        <a
          href={operatorHref({ screen: 'missions' })}
          className="odm-btn odm-btn-sm odm-btn-ic1"
          style={{ flexShrink: 0, fontSize: 16 }}
          title="Về danh sách"
        >
          ←
        </a>
        <span
          className="odm-mono"
          style={{ fontWeight: 700, fontSize: 16, letterSpacing: '0.01em' }}
        >
          {mission.missionCode ?? mission.id}
        </span>
        <StatusBadge tone={STATUS_TONE[mission.status]}>
          {STATUS_LABEL[mission.status] ?? mission.backendStatus ?? mission.status}
        </StatusBadge>

        {/* spacer */}
        <div style={{ flex: 1 }} />
        {access?.canExecuteMonitoringChecklist === true && !canHandleInspectionMedia && <a className="odm-btn" href={operatorHref({ screen: 'upload', missionId: mission.id })}>Checklist & media</a>}

        {access?.canOperatePayload &&
          mission.status !== 'IN_FLIGHT' &&
          !GCS_CONNECTED_STATUSES.has(mission.backendStatus ?? '') && (
          <a
            className="odm-btn"
            href={operatorHref({ screen: 'preflight', missionId: mission.id })}
          >
            Kiểm tra thiết bị
          </a>
        )}
        {access?.canMaintainDevice &&
          ['RETURNING', 'POSTFLIGHT_CHECKING'].includes(
            mission.backendStatus ?? '',
          ) && (
            <a
              className="odm-btn"
              href={operatorHref({
                screen: 'postflight',
                missionId: mission.id,
              })}
            >
              Kiểm tra sau bay
            </a>
          )}
        {canHandleInspectionMedia && (
          <a
            className="odm-btn"
            href={operatorHref({ screen: 'upload', missionId: mission.id })}
          >
            Mở media nghiệm thu
          </a>
        )}
        {showProgressBadge ? (
          <StatusBadge tone={progressBadge.tone}>
            {progressBadge.label}
          </StatusBadge>
        ) : null}
        {/* Action permissions come from the backend assignment policy. */}
        {mission.status === 'PENDING' && hasAccepted ? (
          <StatusBadge tone="green">Bạn đã chấp nhận</StatusBadge>
        ) : mission.status === 'PENDING' ? (
          <>
            <button
              type="button"
              className="odm-btn odm-btn-rd"
              onClick={onOpenReject}
              disabled={submitting || !access?.canRespond}
            >
              Từ chối
            </button>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={onAccept}
              disabled={submitting || !access?.canRespond}
            >
              {submitting ? 'Đang xử lý...' : 'Chấp nhận'}
            </button>
          </>
        ) : mission.backendStatus === 'READY_TO_FLY' &&
          access?.canControlFlight ? (
          <a
            className="odm-btn odm-btn-p"
            href={operatorHref({ screen: 'flight', missionId: mission.id })}
          >
            Mở buồng lái
          </a>
        ) : mission.status === 'ACCEPTED' &&
          access?.canOperatePayload &&
          !GCS_CONNECTED_STATUSES.has(mission.backendStatus ?? '') ? (
          <a
            className="odm-btn odm-btn-p"
            href={operatorHref({ screen: 'connect', missionId: mission.id })}
          >
            Kết nối GCS
          </a>
        ) : mission.status === 'IN_FLIGHT' ? (
          <>
            {access?.canUploadMedia && (
              <a
                className="odm-btn"
                href={operatorHref({ screen: 'upload', missionId: mission.id })}
              >
                Review media
              </a>
            )}
            {access?.canControlFlight && (
              <a
                className="odm-btn odm-btn-p"
                href={operatorHref({ screen: 'flight', missionId: mission.id })}
              >
                Mở buồng lái
              </a>
            )}
          </>
        ) : mission.status === 'COMPLETED' || mission.backendStatus === 'PENDING_REVIEW' ? (
          <>
            {resultSubmitted ? (
              <StatusBadge tone="green">Đã gửi manager</StatusBadge>
            ) : null}
            {access?.canCompleteMission === true && <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={onCompleteMission}
              disabled={submitting || !completeReady}
            >
              {submitting ? 'Đang nghiệm thu...' : 'Nghiệm thu mission'}
            </button>}
            {access?.canSubmitMissionResult === true && <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={onSubmitResult}
              disabled={resultSubmitting || resultSubmitted || !submitReady}
            >
              {resultSubmitting
                ? 'Đang gửi...'
                : resultSubmitted
                  ? 'Đã gửi manager'
                  : 'Gửi kết quả giám sát'}
            </button>}
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
    simX / (111_320 * Math.cos((HCMC_SERVICE_CENTER.latitude * Math.PI) / 180))
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

  return null
}

type GpsPoint = { latitude: number; longitude: number }

const TAN_SON_NHAT_NO_FLY_ZONE: GpsPoint[] = [
  { longitude: 106.6348, latitude: 10.8079 },
  { longitude: 106.6348, latitude: 10.8142 },
  { longitude: 106.638, latitude: 10.8179 },
  { longitude: 106.6479, latitude: 10.8212 },
  { longitude: 106.6548, latitude: 10.8219 },
  { longitude: 106.661, latitude: 10.8232 },
  { longitude: 106.67, latitude: 10.8258 },
  { longitude: 106.6741, latitude: 10.8271 },
  { longitude: 106.6785, latitude: 10.8264 },
  { longitude: 106.6748, latitude: 10.8244 },
  { longitude: 106.6736, latitude: 10.8215 },
  { longitude: 106.6731, latitude: 10.8188 },
  { longitude: 106.6711, latitude: 10.8175 },
  { longitude: 106.6683, latitude: 10.8151 },
  { longitude: 106.6672, latitude: 10.8133 },
  { longitude: 106.6661, latitude: 10.8098 },
  { longitude: 106.6636, latitude: 10.8079 },
  { longitude: 106.661, latitude: 10.809 },
  { longitude: 106.6587, latitude: 10.8103 },
  { longitude: 106.6514, latitude: 10.8095 },
  { longitude: 106.6438, latitude: 10.8077 },
  { longitude: 106.6376, latitude: 10.8066 },
]

const TSN_NO_FLY_LAT_LNGS: L.LatLngExpression[] =
  TAN_SON_NHAT_NO_FLY_ZONE.map((point) => [
    point.latitude,
    point.longitude,
  ])

function orientation(a: GpsPoint, b: GpsPoint, c: GpsPoint) {
  const value =
    (b.longitude - a.longitude) * (c.latitude - a.latitude) -
    (b.latitude - a.latitude) * (c.longitude - a.longitude)
  if (Math.abs(value) < 1e-10) return 0
  return value > 0 ? 1 : -1
}

function onSegment(a: GpsPoint, b: GpsPoint, c: GpsPoint) {
  return (
    Math.min(a.longitude, c.longitude) <= b.longitude + 1e-10 &&
    b.longitude <= Math.max(a.longitude, c.longitude) + 1e-10 &&
    Math.min(a.latitude, c.latitude) <= b.latitude + 1e-10 &&
    b.latitude <= Math.max(a.latitude, c.latitude) + 1e-10
  )
}

function segmentsIntersect(
  a: GpsPoint,
  b: GpsPoint,
  c: GpsPoint,
  d: GpsPoint,
) {
  const o1 = orientation(a, b, c)
  const o2 = orientation(a, b, d)
  const o3 = orientation(c, d, a)
  const o4 = orientation(c, d, b)
  if (o1 !== o2 && o3 !== o4) return true
  if (o1 === 0 && onSegment(a, c, b)) return true
  if (o2 === 0 && onSegment(a, d, b)) return true
  if (o3 === 0 && onSegment(c, a, d)) return true
  return o4 === 0 && onSegment(c, b, d)
}

function pointInsidePolygon(point: GpsPoint, polygon: GpsPoint[]) {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i]
    const b = polygon[j]
    const crosses =
      a.latitude > point.latitude !== b.latitude > point.latitude &&
      point.longitude <
        ((b.longitude - a.longitude) * (point.latitude - a.latitude)) /
          (b.latitude - a.latitude) +
          a.longitude
    if (crosses) inside = !inside
  }
  return inside
}

function segmentTouchesPolygon(a: GpsPoint, b: GpsPoint, polygon: GpsPoint[]) {
  if (pointInsidePolygon(a, polygon) || pointInsidePolygon(b, polygon)) {
    return true
  }
  return polygon.some((point, index) =>
    segmentsIntersect(
      a,
      b,
      point,
      polygon[(index + 1) % polygon.length],
    ),
  )
}

function routeTouchesPolygon(route: GpsPoint[], polygon: GpsPoint[]) {
  return route.some((point, index) => {
    const next = route[index + 1]
    return next ? segmentTouchesPolygon(point, next, polygon) : false
  })
}

function routeDistance(route: GpsPoint[]) {
  return route.reduce((total, point, index) => {
    const next = route[index + 1]
    if (!next) return total
    const latM = (next.latitude - point.latitude) * 111_320
    const lonM =
      (next.longitude - point.longitude) *
      111_320 *
      Math.cos((point.latitude * Math.PI) / 180)
    return total + Math.hypot(latM, lonM)
  }, 0)
}

function avoidNoFlyRoute(home: GpsPoint, target: GpsPoint) {
  const direct = [home, target]
  if (!routeTouchesPolygon(direct, TAN_SON_NHAT_NO_FLY_ZONE)) return direct

  const lats = TAN_SON_NHAT_NO_FLY_ZONE.map((point) => point.latitude)
  const lons = TAN_SON_NHAT_NO_FLY_ZONE.map((point) => point.longitude)
  const pad = 0.006
  const north = Math.max(...lats) + pad
  const south = Math.min(...lats) - pad
  const east = Math.max(...lons) + pad
  const west = Math.min(...lons) - pad
  const candidates: GpsPoint[][] = [
    [home, { latitude: north, longitude: west }, target],
    [home, { latitude: north, longitude: east }, target],
    [home, { latitude: south, longitude: west }, target],
    [home, { latitude: south, longitude: east }, target],
    [
      home,
      { latitude: south, longitude: east },
      { latitude: north, longitude: east },
      target,
    ],
    [
      home,
      { latitude: south, longitude: west },
      { latitude: north, longitude: west },
      target,
    ],
  ]
  return (
    candidates
      .filter((route) => !routeTouchesPolygon(route, TAN_SON_NHAT_NO_FLY_ZONE))
      .sort((a, b) => routeDistance(a) - routeDistance(b))[0] ?? direct
  )
}

function routeMarkerIcon(label: string, color: string) {
  return L.divIcon({
    html: `<div style="
      min-width:42px;
      height:24px;
      padding:0 8px;
      border-radius:999px;
      display:flex;
      align-items:center;
      justify-content:center;
      box-sizing:border-box;
      background:${color};
      color:#fff;
      border:2px solid #fff;
      box-shadow:0 3px 10px rgba(15,23,42,.28);
      font-size:10px;
      font-weight:800;
      line-height:1;
    ">${label}</div>`,
    className: 'mds-route-marker',
    iconSize: [42, 24],
    iconAnchor: [21, 12],
  })
}

function useOperatorMissionMap(mission: OperatorMission) {
  const container = useRef<HTMLDivElement>(null)
  const map = useRef<L.Map | null>(null)
  const marker = useRef<L.Marker | null>(null)
  const circle = useRef<L.Circle | null>(null)
  const homeMarker = useRef<L.Marker | null>(null)
  const targetMarker = useRef<L.Marker | null>(null)
  const routeLine = useRef<L.Polyline | null>(null)
  const noFlyZone = useRef<L.Polygon | null>(null)
  const target = missionTargetGps(mission)
  const targetLat = target?.latitude
  const targetLon = target?.longitude
  const homePoint: GpsPoint = {
    latitude: HCMC_SERVICE_CENTER.latitude,
    longitude: HCMC_SERVICE_CENTER.longitude,
  }
  const home: L.LatLngExpression = [homePoint.latitude, homePoint.longitude]

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
      homeMarker.current = null
      targetMarker.current = null
      routeLine.current = null
      noFlyZone.current = null
    }
  }, [targetLat, targetLon])

  useEffect(() => {
    if (!map.current) return
    const point: L.LatLngExpression | null = target
      ? [target.latitude, target.longitude]
      : null

    if (noFlyZone.current) {
      noFlyZone.current.setLatLngs(TSN_NO_FLY_LAT_LNGS)
    } else {
      noFlyZone.current = L.polygon(TSN_NO_FLY_LAT_LNGS, {
        color: '#dc2626',
        fillColor: '#ef4444',
        fillOpacity: 0.22,
        weight: 2,
      })
        .addTo(map.current)
        .bindTooltip('Vùng cấm bay sân bay Tân Sơn Nhất')
    }

    if (!target || !point) return
    const targetPoint: GpsPoint = {
      latitude: target.latitude,
      longitude: target.longitude,
    }
    const route = avoidNoFlyRoute(homePoint, targetPoint)
    const routeLatLngs = route.map(
      (routePoint) =>
        [routePoint.latitude, routePoint.longitude] as L.LatLngExpression,
    )

    if (homeMarker.current) {
      homeMarker.current.setLatLng(home)
    } else {
      homeMarker.current = L.marker(home, {
        icon: routeMarkerIcon('HOME', '#16a34a'),
        keyboard: false,
      })
        .addTo(map.current)
        .bindTooltip('Điểm xuất phát')
    }

    if (targetMarker.current) {
      targetMarker.current.setLatLng(point)
    } else {
      targetMarker.current = L.marker(point, {
        icon: routeMarkerIcon('TARGET', '#dc2626'),
        keyboard: false,
      })
        .addTo(map.current)
        .bindTooltip('Điểm giám sát')
    }

    if (routeLine.current) {
      routeLine.current.setLatLngs(routeLatLngs)
    } else {
      routeLine.current = L.polyline(routeLatLngs, {
        color: '#2563eb',
        weight: 4,
        opacity: 0.95,
        dashArray: '8 8',
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(map.current)
    }

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

    const bounds = L.latLngBounds([home, point])
    if (circle.current) bounds.extend(circle.current.getBounds())
    if (routeLine.current) bounds.extend(routeLine.current.getBounds())
    if (noFlyZone.current) bounds.extend(noFlyZone.current.getBounds())
    map.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 16 })
  }, [targetLat, targetLon, mission.radiusMeters])

  return { container, target }
}

function MissionMapCard({ mission }: { mission: OperatorMission }) {
  const { container, target } = useOperatorMissionMap(mission)

  return (
    <div className="odm-card" style={{ overflow: 'hidden' }}>
      <div
        className="mds-map-viewport"
        style={{
          position: 'relative',
          background: '#111827',
          overflow: 'hidden',
        }}
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

        {target ? (
          <div
            style={{
              position: 'absolute',
              left: 10,
              top: 10,
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
            Đường bay: HOME → điểm giám sát
          </div>
        ) : null}

        <div
          style={{
            position: 'absolute',
            right: 10,
            bottom: 10,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(254,242,242,.94)',
            color: '#991b1b',
            border: '1px solid rgba(239,68,68,.35)',
            fontSize: 12,
            fontWeight: 700,
            boxShadow: '0 2px 10px rgba(15,23,42,.12)',
            zIndex: 500,
          }}
        >
          Vùng cấm bay Tân Sơn Nhất
        </div>
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
        <StatusBadge tone={STATUS_TONE[mission.status]}>
          {STATUS_LABEL[mission.status] ?? mission.backendStatus ?? mission.status}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        <InfoRow
          icon="#"
          label="Mã mission"
          value={mission.missionCode ?? mission.id}
        />
        <InfoRow
          icon="•"
          label="Trạng thái hệ thống"
          value={mission.backendStatus ?? STATUS_LABEL[mission.status]}
        />
        <InfoRow
          icon="📅"
          label="Ngày bay"
          value={formatVnDate(mission.date)}
        />
        <InfoRow
          icon="⏱"
          label="Giờ bắt đầu"
          value={mission.startTime || 'Chưa lên lịch'}
        />
        <InfoRow
          icon="⏳"
          label="Giờ kết thúc"
          value={mission.endTime || 'Chưa lên lịch'}
        />
        <InfoRow
          icon="📍"
          label="Địa điểm"
          value={locationLabel(mission.location)}
        />
        <InfoRow
          icon="🔵"
          label="Vùng giám sát"
          value={`Bán kính ${mission.radiusMeters == null ? '—' : `${mission.radiusMeters} m`}`}
        />
        <InfoRow
          icon="◎"
          label="Tọa độ GPS"
          value={`${formatCoord(mission.latitude)}, ${formatCoord(mission.longitude)}`}
        />
        <InfoRow
          icon="X"
          label="Tọa độ mô phỏng"
          value={`X ${dash(mission.targetX)} · Y ${dash(mission.targetY)}`}
        />
        <InfoRow icon="📋" label="Loại nhiệm vụ" value={mission.serviceLabel} />

        {/* Description */}
        <div
          style={{
            borderTop: '1px solid var(--bd)',
            paddingTop: 10,
            marginTop: 6,
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--tx3)',
              marginBottom: 5,
              fontWeight: 600,
            }}
          >
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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string
  label: string
  value: string
}) {
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
      <span
        style={{
          color: 'var(--tx3)',
          display: 'flex',
          alignItems: 'center',
          gap: 5,
        }}
      >
        <span style={{ fontSize: 12 }}>{icon}</span>
        {label}
      </span>
      <span
        style={{
          fontWeight: 500,
          textAlign: 'right',
          color: 'var(--tx)',
          minWidth: 0,
        }}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Device card ──────────────────────────────────────────────────────────────

function DroneDeviceCard({ mission }: { mission: OperatorMission }) {
  const droneLabel = formatDeviceLabel(mission) ?? 'Chưa gán thiết bị'
  const deviceInfoRows = [
    { icon: '#', label: 'Device ID', value: mission.deviceId },
    { icon: 'ID', label: 'Device code', value: mission.deviceCode },
    { icon: 'SN', label: 'Serial', value: mission.deviceSerialNumber },
    { icon: '●', label: 'Trạng thái', value: mission.deviceStatus },
    { icon: 'DR', label: 'Drone code', value: mission.droneCode },
    { icon: 'NM', label: 'Tên drone', value: mission.droneName },
    { icon: 'MD', label: 'Model', value: mission.droneModel },
    { icon: 'MC', label: 'Model code', value: mission.deviceModelCode },
    { icon: 'MF', label: 'Hãng', value: mission.deviceManufacturer },
    { icon: 'PL', label: 'Payload', value: mission.dronePayload },
    { icon: 'ST', label: 'Trạm', value: mission.droneStation },
    {
      icon: '↔',
      label: 'Khoảng cách trạm',
      value:
        mission.droneStationDistanceKm == null
          ? null
          : `${mission.droneStationDistanceKm} km`,
    },
    {
      icon: '%',
      label: 'Sẵn sàng',
      value:
        mission.droneReadinessPct == null
          ? null
          : `${mission.droneReadinessPct}%`,
    },
    {
      icon: '⏱',
      label: 'Giờ bay từ bảo trì',
      value:
        mission.droneHoursSinceMaintenance == null
          ? null
          : `${mission.droneHoursSinceMaintenance} giờ`,
    },
  ].filter((row) => row.value != null && String(row.value).trim() !== '')

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
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>
              {droneLabel}
            </div>
            {(mission.droneModel || mission.dronePayload) && (
              <div
                style={{ fontSize: 12, color: 'var(--tx3)', marginBottom: 4 }}
              >
                {[mission.droneModel, mission.dronePayload]
                  .filter(Boolean)
                  .join(' / ')}
              </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusBadge
                tone={
                  mission.droneReadinessPct != null &&
                  mission.droneReadinessPct >= 80
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
        {(mission.droneStation ||
          mission.droneHoursSinceMaintenance != null) && (
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
        {deviceInfoRows.length > 0 ? (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: '1px solid var(--bd)',
            }}
          >
            {deviceInfoRows.map((row) => (
              <InfoRow
                key={`${row.icon}-${row.label}`}
                icon={row.icon}
                label={row.label}
                value={String(row.value)}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ─── Precheck card ────────────────────────────────────────────────────────────

function PrecheckCard({
  preflight,
}: {
  preflight: RuntimePreflightStatus | null
}) {
  const [expanded, setExpanded] = useState(false)
  const passCount =
    preflight?.checks.filter((c) => c.status === 'PASS' || c.status === 'WARN')
      .length ?? 0
  const failCount =
    preflight?.checks.filter((c) => c.status === 'FAIL').length ?? 0
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
                      borderBottom:
                        idx < visibleChecks.length - 1
                          ? '1px solid var(--bd)'
                          : 'none',
                      background:
                        item.status === 'FAIL' ? 'var(--red-bg)' : '#fff',
                      fontSize: 12,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 800,
                        color:
                          item.status === 'FAIL'
                            ? 'var(--red-fg)'
                            : 'var(--green-fg)',
                        fontSize: 13,
                      }}
                    >
                      {item.status === 'FAIL'
                        ? '✗'
                        : item.status === 'PASS' || item.status === 'WARN'
                          ? '✓'
                          : '○'}
                    </span>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          color:
                            item.status === 'FAIL'
                              ? 'var(--red-fg)'
                              : 'var(--tx)',
                        }}
                      >
                        {preflightCheckName(item)}
                      </div>
                      {message && (
                        <div
                          style={{
                            fontSize: 11,
                            color:
                              item.status === 'FAIL'
                                ? 'var(--red-fg)'
                                : 'var(--tx3)',
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
                        color:
                          item.status === 'FAIL'
                            ? 'var(--red-fg)'
                            : 'var(--green-fg)',
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
          {weather
            ? weather.safeToFly
              ? 'An toàn'
              : weather.status
            : 'Chưa check'}
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

function WeatherTile({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: string
}) {
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
      <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 3 }}>
        {label}
      </div>
      <div className="mds-weather-value">{value}</div>
    </div>
  )
}

// ─── Postcheck card ───────────────────────────────────────────────────────────

function PostcheckCard({
  postflight,
}: {
  postflight: PostflightCheckStatus | null
}) {
  const issueText = postflightFaultLabel(postflight?.faultType)
  const noteText = postflightNoteLabel(postflight?.notes)
  const itemChecks =
    postflight?.items?.filter((item) => item.checkName || item.checkType) ?? []
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
        <StatusBadge
          tone={postflight ? (postflight.overallOk ? 'green' : 'red') : 'gray'}
        >
          {postflight
            ? postflight.overallOk
              ? 'Đạt'
              : 'Cần bảo trì'
            : 'Chưa postcheck'}
        </StatusBadge>
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        {postflight ? (
          <>
            {/* Telemetry metrics 2×2 */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 7,
                marginBottom: 10,
              }}
            >
              <PostMetric
                label="Kiểm tra lúc"
                value={formatCheckedAt(postflight.checkedAt)}
              />
              <PostMetric
                label="Độ cao"
                value={formatNumber(postflight.landingAltitudeM, ' m')}
              />
              <PostMetric
                label="Pin hạ cánh"
                value={formatNumber(postflight.landingBatteryPercent, '%')}
              />
              <PostMetric
                label="Tốc độ"
                value={formatNumber(postflight.landingSpeedMps, ' m/s')}
              />
              {postflight.landingTelemetryOnline != null && (
                <PostMetric
                  label="Telemetry"
                  value={
                    postflight.landingTelemetryOnline
                      ? 'Trực tuyến'
                      : 'Mất kết nối'
                  }
                />
              )}
              {postflight.landingHeadingDeg != null && (
                <PostMetric
                  label="Heading"
                  value={formatNumber(postflight.landingHeadingDeg, '°', 0)}
                />
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
                        borderBottom:
                          idx < itemChecks.length - 1
                            ? '1px solid var(--bd)'
                            : 'none',
                        background: isFail ? 'var(--red-bg)' : '#fff',
                        fontSize: 12,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 800,
                          color: isFail
                            ? 'var(--red-fg)'
                            : isWarn
                              ? 'var(--yellow-fg)'
                              : 'var(--green-fg)',
                          fontSize: 13,
                        }}
                      >
                        {isFail ? '✗' : isWarn ? '!' : '✓'}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            color: isFail ? 'var(--red-fg)' : 'var(--tx)',
                          }}
                        >
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
                          color: isFail
                            ? 'var(--red-fg)'
                            : isWarn
                              ? 'var(--yellow-fg)'
                              : 'var(--green-fg)',
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
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 5,
                }}
              >
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
                      background:
                        value === false ? 'var(--red-bg)' : 'var(--sf2)',
                      fontSize: 11.5,
                    }}
                  >
                    <span style={{ color: 'var(--tx3)' }}>{label}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          value === false ? 'var(--red-fg)' : 'var(--green-fg)',
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
                  background: postflight.overallOk
                    ? 'var(--sf2)'
                    : 'var(--red-bg)',
                  color: postflight.overallOk ? 'var(--tx2)' : 'var(--red-fg)',
                  fontSize: 12,
                  lineHeight: 1.45,
                }}
              >
                {issueText && (
                  <div style={{ fontWeight: 700 }}>{issueText}</div>
                )}
                {noteText && (
                  <div style={{ marginTop: issueText ? 3 : 0 }}>{noteText}</div>
                )}
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
      <div style={{ fontSize: 11, color: 'var(--tx3)', marginBottom: 2 }}>
        {label}
      </div>
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
      style={{
        background: 'var(--yellow-bg)',
        borderColor: 'var(--yellow-dot)',
      }}
    >
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        <div
          style={{
            fontWeight: 600,
            fontSize: 12.5,
            marginBottom: 5,
            color: 'var(--yellow-fg)',
          }}
        >
          Ghi chú của quản lý · {mission.managerName ?? ''}
        </div>
        <div
          style={{ fontSize: 12.5, color: 'var(--yellow-fg)', marginBottom: 6 }}
        >
          {mission.managerNote}
        </div>
        {mission.respondBy && mission.status === 'PENDING' && (
          <div
            style={{
              fontSize: 11.5,
              fontWeight: 600,
              color: 'var(--yellow-fg)',
            }}
          >
            Hãy phản hồi trước {formatVnDate(mission.respondBy.slice(0, 10))}{' '}
            {formatHm(mission.respondBy)}
          </div>
        )}
      </div>
    </div>
  )
}
