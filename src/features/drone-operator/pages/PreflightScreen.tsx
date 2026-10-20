import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { env } from '../../../config/env'
import { useI18n } from '../../../shared/i18n'
import { authenticatedFetch } from '../../auth/api/authApi'
import { missionApi } from '../../mission/api/missionApi'
import { flightControlApi } from '../omss/api/flightControlApi'
import { useActiveMission } from '../api/useActiveMission'
import { formatDeviceLabel } from '../lib/deviceLabel'
import { backendPreflightTokenStorageKey } from '../lib/flightWorkflowStorage'
import { operatorHref } from '../routes'
import type { PreflightItemKey, PreflightItemResult } from '../types/mission'
import { preflightScreenMessages } from '../i18n/preflightScreen.messages'
import { FlightStepHeader } from './FlightStepper'
import { preflightGroups, type PreflightItemDef } from './PreflightItem'

// Internal sentinel for "no mission selected" — never rendered, only used
// for control flow so it stays stable across language switches (unlike the
// translated `noMissionSelected` label, which is only for display).
const NO_MISSION_SENTINEL = '__no_mission_selected__'
const NO_DRONE_SENTINEL = '__no_drone_assigned__'

const controlBaseUrl =
  import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090'

type RuntimeStatus =
  | 'PENDING'
  | 'CHECKING'
  | 'PASS'
  | 'WARN'
  | 'FAIL'
  | 'UNKNOWN'
  | 'STALE'
  | 'NOT_APPLICABLE'
type RuntimeOverallStatus = 'CHECKING' | 'READY' | 'FAILED'

type RuntimeCheck = {
  key: string
  name: string
  status: RuntimeStatus
  message: string
  critical: boolean
  source?: 'TELEMETRY' | 'BACKEND' | 'EXTERNAL_API' | 'MANUAL'
  measuredValue?: string | null
  errorCode?: string | null
  checkedAt?: string | null
}

type RuntimePreflightStatus = {
  checkId: string
  status: RuntimeOverallStatus
  progress: number
  checks: RuntimeCheck[]
}

type PersistedPreflightItemStatus =
  | 'PENDING'
  | 'CHECKING'
  | 'PASSED'
  | 'WARNING'
  | 'FAILED'
  | 'UNKNOWN'
  | 'STALE'
  | 'NOT_APPLICABLE'
type PersistedPreflightStatus = 'CHECKING' | 'PASSED' | 'FAILED' | 'CANCELLED'

type PersistedPreflightCheck = {
  id: string
  status: PersistedPreflightStatus
  progressPercent: number
  items: Array<{
    checkType: string
    checkName: string
    status: PersistedPreflightItemStatus
    checkLevel: 'CRITICAL' | 'WARNING' | 'INFO'
    message?: string | null
    source?: 'TELEMETRY' | 'BACKEND' | 'EXTERNAL_API' | 'MANUAL'
    measuredValue?: string | null
    errorCode?: string | null
    checkedAt?: string | null
  }>
}

type PersistedPreflightUpdate = {
  status: PersistedPreflightItemStatus
  message: string
  measuredValue?: string
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

type WeatherObservationForm = {
  source: string
  observedAt: string
  windSpeedMps: string
  windGustMps: string
  precipitationMmH: string
  visibilityKm: string
  temperatureC: string
  humidityPercent: string
  decision: WeatherCheckStatus
  notes: string
}

type ItemState = {
  result: PreflightItemResult | null
  detail?: string
  message?: string
  status?: RuntimeStatus
  source?: RuntimeCheck['source']
  measuredValue?: string | null
  checkedAt?: string | null
}

const RUNTIME_KEY_MAP: Record<string, PreflightItemKey> = {
  GAZEBO: 'gazebo',
  PX4: 'px4',
  MAVSDK: 'mavsdk',
  PX4_CONTROL: 'px4Control',
  LOCAL_POSITION: 'localPosition',
  MAVSDK_HEALTH: 'mavsdkHealth',
  BATTERY: 'battery',
  LIDAR: 'obstacleSensor',
  CAMERA: 'camera',
  BACKEND: 'backend',
  MEDIA: 'media',
  MODULES: 'modules',
}

function mapRuntimeToItems(checks: RuntimeCheck[]) {
  const mapped: Partial<Record<PreflightItemKey, ItemState>> = {}

  for (const check of checks) {
    const key = RUNTIME_KEY_MAP[check.key] ?? check.key
    if (!key) continue

    const current = mapped[key]
    const result =
      check.status === 'PASS' ||
      check.status === 'WARN' ||
      check.status === 'NOT_APPLICABLE'
        ? 'ok'
        : check.status === 'FAIL'
          ? 'fail'
          : null

    if (!current || current.result !== 'fail') {
      mapped[key] = {
        result,
        status: check.status,
        message: check.message,
        source: check.source,
        measuredValue: check.measuredValue,
        checkedAt: check.checkedAt,
      }
    }
  }

  return mapped
}

const MANUAL_DEVICE_KEYS = new Set<PreflightItemKey>([
  'propeller_inspection',
  'airframe_inspection',
  'camera_health',
  'obstacle_sensor_health',
  'manual_override',
  'emergency_landing',
  'flight_visibility',
  'takeoff_area',
  'landing_area',
  'aircraft_handover',
])

const CONNECTION_MANUAL_FALLBACK_KEYS = new Set<PreflightItemKey>([
  'aircraft_connection',
  'command_link',
  'flight_controller',
  'aircraft_readiness',
  'monitoring_connection',
])

type PreflightMessages = (typeof preflightScreenMessages)['vi']

function statusText(
  t: PreflightMessages,
  status?: RuntimeStatus,
  message?: string,
) {
  if (!status) return t.statusNoTrigger
  if (status === 'PASS') return message || t.itemPass
  if (status === 'WARN') return message || t.statusWarnNoBlock
  if (status === 'FAIL') return message || t.itemFail
  if (status === 'CHECKING') return message || t.statusChecking
  if (status === 'UNKNOWN') return message || 'Chưa đủ dữ liệu xác minh'
  if (status === 'STALE') return message || 'Kết quả đã hết hiệu lực'
  if (status === 'NOT_APPLICABLE') return message || 'Không áp dụng'
  return message || t.statusWaiting
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

function readStoredPreflightState(storageKey: string) {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredPreflightStatus
    if (!isRuntimeStatus(parsed.status)) return null
    return parsed.status
  } catch {
    return null
  }
}

function readStoredPreflightSession(storageKey: string) {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredPreflightStatus
    return typeof parsed.runtimeSessionId === 'string'
      ? parsed.runtimeSessionId
      : null
  } catch {
    return null
  }
}

function writeStoredPreflightState(
  storageKey: string,
  status: RuntimePreflightStatus,
  runtimeSessionId?: string | null,
) {
  if (status.checkId === 'triggering') return
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        savedAt: Date.now(),
        runtimeSessionId: runtimeSessionId ?? null,
        status,
      } satisfies StoredPreflightStatus),
    )
  } catch {
    // Preflight still works if storage is unavailable.
  }
}

function clearStoredPreflightState(storageKey: string) {
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // The visible state still resets even if storage cleanup fails.
  }
}

function runtimeStatusFromPersisted(
  persisted: PersistedPreflightCheck,
): RuntimePreflightStatus {
  return {
    checkId: persisted.id,
    status:
      persisted.status === 'PASSED'
        ? 'READY'
        : persisted.status === 'FAILED' || persisted.status === 'CANCELLED'
          ? 'FAILED'
          : 'CHECKING',
    progress: persisted.progressPercent,
    checks: persisted.items.map((item) => ({
      key: item.checkType,
      name: item.checkName,
      status:
        item.status === 'PASSED'
          ? 'PASS'
          : item.status === 'WARNING'
            ? 'WARN'
          : item.status === 'FAILED'
            ? 'FAIL'
            : item.status,
      message: item.message ?? '',
      critical: item.checkLevel === 'CRITICAL',
      source: item.source,
      measuredValue: item.measuredValue,
      errorCode: item.errorCode,
      checkedAt: item.checkedAt,
    })),
  }
}

function updateOnlyPersistedItem(
  current: RuntimePreflightStatus | null,
  persisted: PersistedPreflightCheck,
  checkType: string,
) {
  const updatedItem = runtimeStatusFromPersisted(persisted).checks.find(
    (item) => item.key === checkType,
  )
  if (!updatedItem) return current
  if (!current) {
    return {
      ...runtimeStatusFromPersisted(persisted),
      checks: [updatedItem],
    }
  }
  const exists = current.checks.some((item) => item.key === checkType)
  return {
    ...current,
    progress: persisted.progressPercent,
    checks: exists
      ? current.checks.map((item) =>
          item.key === checkType ? updatedItem : item,
        )
      : [...current.checks, updatedItem],
  }
}

async function fetchCurrentPersistedPreflight(
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
  return persisted as PersistedPreflightCheck
}

async function fetchPersistedPreflight(
  persistedId: string,
  signal?: AbortSignal,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/pre-device-checks/${encodeURIComponent(persistedId)}`,
    { cache: 'no-store', signal },
  )
  if (!response.ok) return null
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  if (!persisted || typeof persisted.id !== 'string') return null
  return persisted as PersistedPreflightCheck
}

async function updatePersistedPreflightItem(
  persistedId: string,
  checkType: string,
  update: PersistedPreflightUpdate,
) {
  const response = await authenticatedFetch(
    `${env.apiBaseUrl}/api/pre-device-checks/${encodeURIComponent(persistedId)}/items/${encodeURIComponent(checkType)}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    },
  )
  if (!response.ok) {
    throw new Error(`Persisted preflight item ${checkType} ${response.status}`)
  }
  const payload = await response.json()
  const persisted = payload?.data ?? payload
  return persisted as PersistedPreflightCheck
}

function persistedStatusFromRuntime(
  status: RuntimeStatus,
): PersistedPreflightItemStatus {
  if (status === 'PASS' || status === 'WARN') return 'PASSED'
  if (status === 'FAIL') return 'FAILED'
  if (status === 'CHECKING') return 'CHECKING'
  return 'PENDING'
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

function readStoredWeatherState(storageKey: string) {
  try {
    const raw = window.localStorage.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredWeatherStatus
    if (!isWeatherStatus(parsed.status)) return null
    return parsed.status
  } catch {
    return null
  }
}

function writeStoredWeatherState(
  storageKey: string,
  status: WeatherPreflightStatus,
) {
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({
        savedAt: Date.now(),
        status,
      } satisfies StoredWeatherStatus),
    )
  } catch {
    // Weather check still works if storage is unavailable.
  }
}

function formatWeatherObservedAt(date = new Date()) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function weatherFormFromStatus(
  status: WeatherPreflightStatus | null,
): WeatherObservationForm {
  return {
    source: status?.advisories.find((item) => item.startsWith('Nguồn: '))?.slice(7) ?? '',
    observedAt: status?.checkedAt
      ? formatWeatherObservedAt(new Date(status.checkedAt))
      : formatWeatherObservedAt(),
    windSpeedMps: status ? String(status.windSpeedMps) : '',
    windGustMps: status ? String(status.windGustMps) : '',
    precipitationMmH: status ? String(status.precipitationMmH) : '',
    visibilityKm: status ? String(status.visibilityKm) : '',
    temperatureC: status ? String(status.temperatureC) : '',
    humidityPercent: status ? String(status.humidityPercent) : '',
    decision: status?.status ?? 'PASS',
    notes: status?.summary ?? '',
  }
}

function isMissionInFlight(status?: string | null) {
  return (
    status === 'IN_FLIGHT' || status === 'IN_PROGRESS' || status === 'RETURNING'
  )
}

function demoFlightToken(missionId: string, deviceId: string) {
  return `demo-flight-token:${missionId}:${deviceId}:${Date.now()}`
}

export function PreflightScreen({ missionId }: { missionId?: string }) {
  const mission = useActiveMission(missionId)
  useI18n(preflightScreenMessages)
  const t = preflightScreenMessages.vi
  const [startError, setStartError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  async function handleContinueToHandover() {
    const data = mission.data
    const deviceId = data?.deviceId
    if (!mission.missionId || !deviceId) {
      setStartError(t.noDroneAssignedError)
      return
    }
    setStarting(true)
    setStartError(null)
    try {
      const permissions = await missionApi.getPermissions(mission.missionId)
      if (!permissions.canOperatePayload)
        throw new Error('Operator assignment is required for preflight.')
      if (isMissionInFlight(data?.status)) {
        if (permissions.canControlFlight) {
          window.sessionStorage.setItem(
            'odm.operator.autoStartSimulation',
            'true',
          )
        }
        window.location.hash = operatorHref({
          screen: permissions.canControlFlight ? 'flight' : 'missionDetail',
          missionId: mission.missionId,
        })
        return
      }
      await flightControlApi.bindSession(mission.missionId, deviceId)
      const completedPreflight = data?.status === 'READY_TO_FLY'
        ? null
        : await missionApi.runPreflightCheck(mission.missionId, deviceId)
      const tokenValue =
        completedPreflight?.flightToken?.tokenValue ??
        window.sessionStorage.getItem(
          backendPreflightTokenStorageKey(mission.missionId, deviceId),
        ) ??
        demoFlightToken(mission.missionId, deviceId)
      window.sessionStorage.setItem(
        backendPreflightTokenStorageKey(mission.missionId, deviceId),
        tokenValue,
      )
      window.location.hash = operatorHref({
        screen: 'handover',
        missionId: mission.missionId,
      })
    } catch (cause) {
      setStartError(
        cause instanceof Error ? cause.message : t.confirmPrecheckFailed,
      )
    } finally {
      setStarting(false)
    }
  }

  return (
    <>
      {(mission.error || startError) && (
        <p role="alert" style={{ color: 'var(--red-fg)' }}>
          {startError ??
            (mission.error instanceof Error
              ? mission.error.message
              : t.loadMissionFailed)}
        </p>
      )}
      {starting && <p>{t.confirmingTelemetry}</p>}
      <PreflightChecklistPanel
        missionId={mission.missionId ?? NO_MISSION_SENTINEL}
        missionLabel={
          mission.data?.missionCode ?? mission.missionId ?? t.noMissionSelected
        }
        deviceId={mission.data?.deviceId ?? NO_DRONE_SENTINEL}
        deviceLabel={
          mission.data
            ? (formatDeviceLabel(mission.data) ?? undefined)
            : undefined
        }
        missionStatus={mission.data?.status}
        latitude={mission.data?.latitude ?? undefined}
        longitude={mission.data?.longitude ?? undefined}
        onReady={() => {
          void handleContinueToHandover()
        }}
      />
    </>
  )
}

export function PreflightChecklistPanel({
  missionId,
  missionLabel,
  deviceId,
  deviceLabel,
  missionStatus,
  latitude,
  longitude,
  onReady,
  embedded = false,
}: {
  missionId: string
  missionLabel?: string
  deviceId: string
  deviceLabel?: string
  missionStatus?: string | null
  latitude?: number | null
  longitude?: number | null
  onReady?: () => void
  embedded?: boolean
}) {
  useI18n(preflightScreenMessages)
  const t = preflightScreenMessages.vi
  const PREFLIGHT_GROUPS = useMemo(() => preflightGroups('vi'), [])
  const RUNTIME_GROUPS = useMemo(
    () => PREFLIGHT_GROUPS,
    [PREFLIGHT_GROUPS],
  )
  const ALL_ITEMS = useMemo(
    () => RUNTIME_GROUPS.flatMap((group) => group.items),
    [RUNTIME_GROUPS],
  )
  const storageKey = useMemo(
    () => preflightStateStorageKey(missionId, deviceId),
    [deviceId, missionId],
  )
  const weatherStorageKey = useMemo(
    () => weatherStateStorageKey(missionId, deviceId),
    [deviceId, missionId],
  )
  const [checkId, setCheckId] = useState<string | null>(null)
  const [runtimeStatus, setRuntimeStatus] =
    useState<RuntimePreflightStatus | null>(() =>
      readStoredPreflightState(storageKey),
    )
  const [weatherStatus, setWeatherStatus] =
    useState<WeatherPreflightStatus | null>(() =>
      readStoredWeatherState(weatherStorageKey),
    )
  const [weatherForm, setWeatherForm] = useState<WeatherObservationForm>(() =>
    weatherFormFromStatus(readStoredWeatherState(weatherStorageKey)),
  )
  const [error, setError] = useState<string | null>(null)
  const [backendPreflightMessage, setBackendPreflightMessage] = useState<
    string | null
  >(null)
  const [backendPreflightRegistering, setBackendPreflightRegistering] =
    useState(false)
  const backendPreflightRegisteredRef = useRef(false)
  const [triggering, setTriggering] = useState(false)
  const [weatherSuggesting, setWeatherSuggesting] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const validatedStoredCheckRef = useRef(false)
  const controllerOfflineMissesRef = useRef(0)
  const [, setControllerOnline] = useState(false)
  const [runtimeSessionId, setRuntimeSessionId] = useState<string | null>(() =>
    readStoredPreflightSession(storageKey),
  )
  const [persistedPreflightId, setPersistedPreflightId] = useState<
    string | null
  >(null)
  const [persistedPreflightStatus, setPersistedPreflightStatus] =
    useState<PersistedPreflightStatus | null>(null)
  const [persistedWeatherPassed, setPersistedWeatherPassed] = useState(false)
  const [manualDeviceChecks, setManualDeviceChecks] = useState<
    Partial<Record<PreflightItemKey, PreflightItemResult>>
  >({})
  const [batteryPercentInput, setBatteryPercentInput] = useState('')
  const [batteryChecking, setBatteryChecking] = useState(false)
  const [batterySaving, setBatterySaving] = useState(false)
  const [batteryCheckNotice, setBatteryCheckNotice] = useState<string | null>(null)
  const [connectionChecking, setConnectionChecking] = useState(false)
  const [connectionCheckNotice, setConnectionCheckNotice] = useState<string | null>(null)
  const syncedPersistedItemsRef = useRef<Record<string, string>>({})
  const syncingPersistedItemsRef = useRef(false)

  useEffect(() => {
    validatedStoredCheckRef.current = false
    controllerOfflineMissesRef.current = 0
    syncedPersistedItemsRef.current = {}
    syncingPersistedItemsRef.current = false
    setPersistedPreflightId(null)
    setPersistedPreflightStatus(null)
    setPersistedWeatherPassed(false)
    setManualDeviceChecks({})
    setBatteryPercentInput('')
    setBatteryCheckNotice(null)
    setConnectionCheckNotice(null)
    const storedWeather = readStoredWeatherState(weatherStorageKey)
    setWeatherStatus(storedWeather)
    setWeatherForm(weatherFormFromStatus(storedWeather))
    setRuntimeSessionId(readStoredPreflightSession(storageKey))
  }, [missionId, deviceId, storageKey, weatherStorageKey])

  const itemStates = useMemo(() => {
    const mapped = mapRuntimeToItems(runtimeStatus?.checks ?? [])
    for (const key of MANUAL_DEVICE_KEYS) {
      const localResult = manualDeviceChecks[key]
      if (localResult === undefined && mapped[key]) continue
      const result = localResult ?? null
      mapped[key] = {
        result,
        status: result === 'ok' ? 'PASS' : result === 'fail' ? 'FAIL' : 'PENDING',
        message:
          result === 'ok'
            ? 'Người dùng xác nhận đạt'
            : result === 'fail'
              ? 'Người dùng xác nhận không đạt'
              : 'Chờ người dùng kiểm tra',
      }
    }
    return mapped
  }, [manualDeviceChecks, runtimeStatus])
  const nOk = ALL_ITEMS.filter(
    (item) => itemStates[item.key]?.result === 'ok',
  ).length
  const nTotal = ALL_ITEMS.length
  const failedItems = ALL_ITEMS.filter(
    (item) => itemStates[item.key]?.result === 'fail',
  )
  const runtimeItemsReady = nOk === nTotal && failedItems.length === 0
  const weatherReady =
    weatherStatus?.safeToFly === true ||
    persistedWeatherPassed ||
    itemStates.weather_conditions?.result === 'ok'
  const isReady =
    runtimeItemsReady &&
    weatherReady &&
    persistedPreflightStatus === 'PASSED'
  const progress = runtimeStatus?.progress ?? 0
  const hasTriggered = runtimeStatus !== null || checkId !== null || triggering
  const canContinueToHandover = isReady
  const isAlreadyInFlight = isMissionInFlight(missionStatus)
  const isFailed =
    runtimeStatus?.status === 'FAILED' ||
    persistedPreflightStatus === 'FAILED' ||
    weatherStatus?.safeToFly === false

  useEffect(() => {
    backendPreflightRegisteredRef.current = false
    setBackendPreflightMessage(null)
  }, [missionId, deviceId])

  async function syncRuntimeStatusToBackend(
    status: RuntimePreflightStatus,
    persistedId: string | null,
  ) {
    if (
      !persistedId ||
      status.checkId === 'triggering' ||
      syncingPersistedItemsRef.current
    ) {
      return
    }

    syncingPersistedItemsRef.current = true

    try {
      for (const check of status.checks) {
        const itemStatus = persistedStatusFromRuntime(check.status)
        if (itemStatus === 'PENDING') continue

        const syncKey = `${check.key}:${itemStatus}:${check.message}`
        if (syncedPersistedItemsRef.current[check.key] === syncKey) continue

        const persisted = await updatePersistedPreflightItem(
          persistedId,
          check.key,
          {
            status: itemStatus,
            message: check.message,
          },
        )
        syncedPersistedItemsRef.current[check.key] = syncKey
        if (persisted?.id === persistedId) {
          setPersistedPreflightStatus(persisted.status)
        }
      }
    } catch {
      // The persisted-status poll retries items that have not been saved yet.
    } finally {
      syncingPersistedItemsRef.current = false
    }
  }

  async function handleTriggerCheck() {
    setTriggering(true)
    setError(null)
    setCheckId(null)
    setPersistedPreflightId(null)
    setPersistedPreflightStatus(null)
    setPersistedWeatherPassed(false)
    syncedPersistedItemsRef.current = {}
    syncingPersistedItemsRef.current = false
    backendPreflightRegisteredRef.current = false
    window.sessionStorage.removeItem(
      backendPreflightTokenStorageKey(missionId, deviceId),
    )
    clearStoredPreflightState(storageKey)
    setRuntimeStatus({
      checkId: 'triggering',
      status: 'CHECKING',
      progress: 0,
      checks: ALL_ITEMS.map((item) => ({
        key: item.key,
        name: item.label,
        status: 'CHECKING',
        message: t.statusChecking,
        critical: true,
      })),
    })

    try {
      const response = await authenticatedFetch(
        `${env.apiBaseUrl}/api/missions/${encodeURIComponent(missionId)}/pre-device-checks`,
        {
        method: 'POST',
        },
      )
      if (!response.ok) throw new Error(`Preflight API ${response.status}`)
      const envelope = await response.json()
      const persisted = (envelope.data ?? envelope) as PersistedPreflightCheck
      const next = runtimeStatusFromPersisted(persisted)
      setCheckId(null)
      setPersistedPreflightId(persisted.id)
      setPersistedPreflightStatus(persisted.status)
      setRuntimeStatus(next)

      // Thử ghi/đọc/xóa một tệp kiểm tra nhỏ trên kho lưu trữ thật.
      // Dù phép thử lỗi, backend vẫn lưu trạng thái FAILED để cho phép xác nhận thủ công.
      await authenticatedFetch(
        `${env.apiBaseUrl}/api/pre-device-checks/${encodeURIComponent(persisted.id)}/media-probe/automatic`,
        { method: 'POST' },
      ).catch(() => null)
      const refreshed = await fetchPersistedPreflight(persisted.id).catch(
        () => null,
      )
      if (refreshed) {
        setPersistedPreflightStatus(refreshed.status)
        setRuntimeStatus(runtimeStatusFromPersisted(refreshed))
      }
    } catch {
      setRuntimeStatus(null)
      setError(t.triggerFailed)
    } finally {
      setTriggering(false)
    }
  }

  async function handleManualCheck(
    key: PreflightItemKey,
    result: PreflightItemResult,
  ) {
    if (key === 'battery_health') {
      const percent = Number(batteryPercentInput)
      if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
        setError('Hãy kiểm tra hoặc nhập mức pin từ 0 đến 100 trước khi xác nhận.')
        return
      }
    }
    setManualDeviceChecks((current) => ({ ...current, [key]: result }))
    if (!persistedPreflightId) return
    try {
      const persisted = await updatePersistedPreflightItem(
        persistedPreflightId,
        key,
        {
          status: result === 'ok' ? 'PASSED' : 'FAILED',
          message:
            result === 'ok'
              ? 'Người vận hành xác nhận đạt'
              : 'Người vận hành xác nhận không đạt',
          measuredValue:
            key === 'battery_health' && batteryPercentInput.trim() !== ''
              ? batteryPercentInput
              : undefined,
        },
      )
      setPersistedPreflightStatus(persisted.status)
      setRuntimeStatus((current) =>
        updateOnlyPersistedItem(current, persisted, key),
      )
    } catch {
      setManualDeviceChecks((current) => ({ ...current, [key]: undefined }))
      setError('Không thể lưu kết quả kiểm tra thủ công.')
    }
  }

  async function handleGazeboBatteryCheck() {
    setBatteryChecking(true)
    setError(null)
    setBatteryCheckNotice('Đang kiểm tra riêng pin máy bay…')
    try {
      const simulationResponse = await fetch(
        `${controlBaseUrl}/api/control/status`,
        { cache: 'no-store' },
      )
      if (simulationResponse.ok) {
        const simulationStatus = await simulationResponse.json()
        const simulatedPercent = Number(simulationStatus?.batteryPercent)
        if (
          Number.isFinite(simulatedPercent) &&
          simulatedPercent >= 0 &&
          simulatedPercent <= 100
        ) {
          const displayedPercent = Math.round(simulatedPercent * 10) / 10
          setBatteryPercentInput(String(displayedPercent))
          setBatteryCheckNotice(`Mức pin hiện tại: ${displayedPercent}%`)
          return
        }
      }

      let activeId = persistedPreflightId
      if (!activeId && missionId !== NO_MISSION_SENTINEL) {
        const current = await fetchCurrentPersistedPreflight(missionId).catch(
          () => null,
        )
        if (current) {
          activeId = current.id
          setPersistedPreflightId(current.id)
          setPersistedPreflightStatus(current.status)
        }
      }
      if (!activeId) {
        throw new Error('Preflight session unavailable')
      }
      const response = await authenticatedFetch(
        `${env.apiBaseUrl}/api/pre-device-checks/${encodeURIComponent(activeId)}/items/battery_health/recheck`,
        { method: 'POST' },
      )
      if (!response.ok) throw new Error(`Battery recheck ${response.status}`)
      const payload = await response.json()
      const persisted = (payload?.data ?? payload) as PersistedPreflightCheck
      const batteryResult = persisted.items.find(
        (item) => item.checkType === 'battery_health',
      )
      setPersistedPreflightStatus(persisted.status)
      setRuntimeStatus(runtimeStatusFromPersisted(persisted))
      if (batteryResult?.status === 'PASSED') {
        setBatteryCheckNotice(
          `Đã lấy được mức pin tự động${batteryResult.measuredValue ? `: ${batteryResult.measuredValue}` : '.'}`,
        )
      } else {
        setBatteryCheckNotice(
          batteryResult?.message ||
            'Không lấy được dữ liệu pin tự động. Vui lòng nhập mức pin thực tế.',
        )
      }
    } catch {
      setBatteryCheckNotice(
        'Kiểm tra tự động không thành công. Vui lòng nhập mức pin thực tế.',
      )
      setError('Không đọc được pin từ Gazebo. Vui lòng nhập phần trăm pin thủ công.')
    } finally {
      setBatteryChecking(false)
    }
  }

  async function handleSaveManualBattery() {
    const percent = Number(batteryPercentInput)
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) {
      setError('Phần trăm pin phải nằm trong khoảng từ 0 đến 100.')
      return
    }
    setBatterySaving(true)
    setError(null)
    try {
      let activeId = persistedPreflightId
      if (!activeId && missionId !== NO_MISSION_SENTINEL) {
        const current = await fetchCurrentPersistedPreflight(missionId).catch(
          () => null,
        )
        if (current) {
          activeId = current.id
          setPersistedPreflightId(current.id)
          setPersistedPreflightStatus(current.status)
        }
      }
      if (!activeId) {
        throw new Error('Preflight session unavailable')
      }
      const persisted = await updatePersistedPreflightItem(
        activeId,
        'battery_health',
        {
          status: 'PASSED',
          message: 'Người vận hành nhập mức pin thủ công',
          measuredValue: String(percent),
        },
      )
      setPersistedPreflightStatus(persisted.status)
      setRuntimeStatus(runtimeStatusFromPersisted(persisted))
    } catch {
      setError('Không thể lưu mức pin. Chỉ được nhập tay khi Gazebo không có dữ liệu hoặc kiểm tra pin thất bại.')
    } finally {
      setBatterySaving(false)
    }
  }

  async function handleConnectionControllerCheck() {
    setConnectionChecking(true)
    setConnectionCheckNotice('Đang đọc trạng thái bộ điều khiển…')
    setError(null)
    try {
      let activeId = persistedPreflightId
      if (!activeId && missionId !== NO_MISSION_SENTINEL) {
        const current = await fetchCurrentPersistedPreflight(missionId).catch(
          () => null,
        )
        if (current) {
          activeId = current.id
          setPersistedPreflightId(current.id)
          setPersistedPreflightStatus(current.status)
        }
      }
      if (!activeId) {
        throw new Error('Preflight session unavailable')
      }
      const response = await fetch(`${controlBaseUrl}/api/control/status`, {
        cache: 'no-store',
      })
      if (!response.ok) throw new Error(`Flight controller ${response.status}`)
      const status = await response.json()
      const px4Connected = status?.connection?.px4Connected
      const grpcConnected = status?.connection?.grpcConnected
      const localPositionAgeS = Number(status?.freshness?.localPositionAgeS)
      const healthAgeS = Number(status?.freshness?.healthAgeS)

      const results: Array<{
        key: PreflightItemKey
        passed: boolean
        message: string
      }> = []
      if (typeof px4Connected === 'boolean') {
        results.push({
          key: 'aircraft_connection',
          passed: px4Connected,
          message: px4Connected
            ? 'Bộ điều khiển đang kết nối và gửi dữ liệu'
            : 'Không kết nối được với bộ điều khiển bay',
        })
      }
      if (typeof px4Connected === 'boolean' && typeof grpcConnected === 'boolean') {
        results.push({
          key: 'flight_controller',
          passed: px4Connected && grpcConnected,
          message:
            px4Connected && grpcConnected
              ? 'PX4 và MAVSDK đang hoạt động'
              : 'PX4 hoặc MAVSDK chưa sẵn sàng',
        })
      }
      if (typeof status?.positionReady === 'boolean') {
        results.push({
          key: 'aircraft_readiness',
          passed:
            status.positionReady &&
            (!Number.isFinite(healthAgeS) || healthAgeS <= 5),
          message: status.positionReady
            ? 'Bộ điều khiển xác nhận trạng thái sẵn sàng'
            : 'Bộ điều khiển chưa xác nhận sẵn sàng bay',
        })
      }
      if (typeof px4Connected === 'boolean' && Number.isFinite(localPositionAgeS)) {
        results.push({
          key: 'monitoring_connection',
          passed: px4Connected && localPositionAgeS <= 5,
          message:
            px4Connected && localPositionAgeS <= 5
              ? 'Telemetry giám sát đang được cập nhật liên tục'
              : 'Telemetry giám sát bị gián đoạn hoặc quá hạn',
        })
      }

      if (results.length === 0) {
        setConnectionCheckNotice(
          'Bộ điều khiển không trả dữ liệu phù hợp. Vui lòng kiểm tra thủ công.',
        )
        return
      }

      let savedCount = 0
      for (const result of results) {
        try {
          const persisted = await updatePersistedPreflightItem(
            activeId,
            result.key,
            {
              status: result.passed ? 'PASSED' : 'FAILED',
              message: result.message,
            },
          )
          setPersistedPreflightStatus(persisted.status)
          setRuntimeStatus((current) =>
            updateOnlyPersistedItem(current, persisted, result.key),
          )
          savedCount += 1
        } catch {
          // Không có dữ liệu hợp lệ hoặc backend không cho tự động cập nhật:
          // giữ nguyên tiêu chí để người vận hành xác nhận thủ công.
        }
      }
      const missingCount = CONNECTION_MANUAL_FALLBACK_KEYS.size - savedCount
      setConnectionCheckNotice(
        `Đã kiểm tra tự động ${savedCount} mục${missingCount > 0 ? ` · ${missingCount} mục còn lại kiểm tra thủ công` : ''}.`,
      )
    } catch {
      setConnectionCheckNotice(
        'Không kết nối được bộ điều khiển. Vui lòng kiểm tra thủ công từng mục.',
      )
    } finally {
      setConnectionChecking(false)
    }
  }

  async function handleWeatherSuggestion() {
    setWeatherSuggesting(true)
    setWeatherError(null)

    try {
      if (
        typeof latitude !== 'number' ||
        typeof longitude !== 'number' ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        throw new Error('Missing mission coordinates')
      }

      const response = await authenticatedFetch(
        `${env.apiBaseUrl}/api/weather/preflight-check`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            missionId:
              missionId === NO_MISSION_SENTINEL ? undefined : missionId,
            deviceId: deviceId === NO_DRONE_SENTINEL ? undefined : deviceId,
            latitude,
            longitude,
          }),
        },
      )
      if (!response.ok) throw new Error(`Weather API ${response.status}`)
      const payload = await response.json()
      const nextStatus = payload.data ?? payload
      if (!isWeatherStatus(nextStatus)) {
        throw new Error('Invalid weather payload')
      }

      setWeatherForm({
        ...weatherFormFromStatus(nextStatus),
        source: 'Hệ thống thời tiết theo tọa độ mission',
      })
      setWeatherStatus(nextStatus)
      writeStoredWeatherState(weatherStorageKey, nextStatus)
      if (missionId !== NO_MISSION_SENTINEL) {
        const persisted = await fetchCurrentPersistedPreflight(missionId)
        if (persisted) {
          setPersistedPreflightId(persisted.id)
          setPersistedPreflightStatus(persisted.status)
          setPersistedWeatherPassed(
            persisted.items.some(
              (item) =>
                item.checkType === 'weather_conditions' &&
                item.status === 'PASSED',
            ),
          )
        }
      }
    } catch {
      setWeatherError(t.weatherForecastUnavailable)
    } finally {
      setWeatherSuggesting(false)
    }
  }

  useEffect(() => {
    let alive = true

    async function checkControllerOnline() {
      try {
        const response = await fetch(`${controlBaseUrl}/api/control/status`, {
          cache: 'no-store',
        })
        if (!response.ok) throw new Error(`Controller ${response.status}`)
        const payload = await response.json().catch(() => null)
        const boundToCurrentMission =
          !payload?.missionId ||
          payload.missionId === missionId ||
          payload.missionCode === missionLabel
        const boundToCurrentDevice =
          !payload?.deviceId || payload.deviceId === deviceId
        if (!alive) return
        if (!boundToCurrentMission || !boundToCurrentDevice) {
          throw new Error('Controller bound to another mission')
        }
        const nextRuntimeSessionId =
          typeof payload?.runtimeSessionId === 'string'
            ? payload.runtimeSessionId
            : null
        controllerOfflineMissesRef.current = 0
        setRuntimeSessionId((currentSessionId) => {
          if (
            currentSessionId &&
            nextRuntimeSessionId &&
            currentSessionId !== nextRuntimeSessionId
          ) {
            setCheckId(null)
            setRuntimeStatus(null)
            setPersistedPreflightId(null)
            setPersistedPreflightStatus(null)
            setPersistedWeatherPassed(false)
            syncedPersistedItemsRef.current = {}
            syncingPersistedItemsRef.current = false
            setBackendPreflightMessage(null)
            setWeatherError(null)
            backendPreflightRegisteredRef.current = false
            validatedStoredCheckRef.current = false
            clearStoredPreflightState(storageKey)
          }
          return nextRuntimeSessionId ?? currentSessionId
        })
        setControllerOnline(true)
      } catch {
        if (!alive) return
        setControllerOnline(false)
        controllerOfflineMissesRef.current += 1
        if (controllerOfflineMissesRef.current >= 3) {
          setRuntimeSessionId(null)
          setCheckId(null)
          setBackendPreflightMessage(null)
          backendPreflightRegisteredRef.current = false
        }
      }
    }

    void checkControllerOnline()
    const timer = window.setInterval(checkControllerOnline, 2500)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [deviceId, missionId, missionLabel, storageKey])

  useEffect(() => {
    if (!missionId || missionId === NO_MISSION_SENTINEL) return
    let alive = true
    const controller = new AbortController()

    async function loadMissionPreflightState() {
      const persisted = await fetchCurrentPersistedPreflight(
        missionId,
        controller.signal,
      ).catch(() => null)
      if (!alive || !persisted) return
      const persistedRuntime = runtimeStatusFromPersisted(persisted)
      setPersistedPreflightId(persisted.id)
      setPersistedPreflightStatus(persisted.status)
      setPersistedWeatherPassed(
        persisted.items.some(
          (item) =>
            item.checkType === 'weather_conditions' &&
            item.status === 'PASSED',
        ),
      )
      setRuntimeStatus((current) => {
        if (current?.checkId === persisted.id) return current
        writeStoredPreflightState(
          storageKey,
          persistedRuntime,
          runtimeSessionId,
        )
        return persistedRuntime
      })
    }

    void loadMissionPreflightState()
    return () => {
      alive = false
      controller.abort()
    }
  }, [missionId, runtimeSessionId, storageKey])

  useEffect(() => {
    if (!checkId) return
    let alive = true

    async function poll() {
      try {
        const response = await fetch(
          `${controlBaseUrl}/api/preflight/${checkId}`,
          { cache: 'no-store' },
        )
        if (!response.ok) throw new Error(`Preflight status ${response.status}`)
        const payload = await response.json()
        if (!alive) return
        setRuntimeStatus(payload)
        writeStoredPreflightState(storageKey, payload, runtimeSessionId)
        void syncRuntimeStatusToBackend(payload, persistedPreflightId)
        if (payload.status === 'READY' || payload.status === 'FAILED') {
          setCheckId(null)
        }
      } catch {
        if (!alive) return
        setError(t.precheckConnectionLost)
        setCheckId(null)
      }
    }

    void poll()
    const timer = window.setInterval(poll, 800)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [checkId, persistedPreflightId, runtimeSessionId, storageKey])

  useEffect(() => {
    const weatherPassed =
      weatherStatus?.safeToFly === true || persistedWeatherPassed
    if (
      !runtimeItemsReady ||
      !weatherPassed ||
      !persistedPreflightId ||
      persistedPreflightStatus !== 'CHECKING'
    ) {
      return
    }

    const activePersistedId = persistedPreflightId
    let alive = true
    const controller = new AbortController()

    async function refreshPersistedStatus() {
      const persisted = await fetchPersistedPreflight(
        activePersistedId,
        controller.signal,
      ).catch(() => null)
      if (!alive || !persisted || persisted.id !== activePersistedId) return

      setPersistedPreflightStatus(persisted.status)
      setPersistedWeatherPassed(
        persisted.items.some(
          (item) =>
            item.checkType === 'weather_conditions' &&
            item.status === 'PASSED',
        ),
      )

      if (runtimeStatus) {
        let hasBackendLag = false
        for (const check of runtimeStatus.checks) {
          const expected = persistedStatusFromRuntime(check.status)
          const actual = persisted.items.find(
            (item) => item.checkType === check.key,
          )?.status
          if (
            (expected === 'PASSED' || expected === 'FAILED') &&
            actual !== expected
          ) {
            delete syncedPersistedItemsRef.current[check.key]
            hasBackendLag = true
          }
        }
        if (hasBackendLag) {
          void syncRuntimeStatusToBackend(runtimeStatus, activePersistedId)
        }
      }
    }

    void refreshPersistedStatus()
    const timer = window.setInterval(refreshPersistedStatus, 800)
    return () => {
      alive = false
      controller.abort()
      window.clearInterval(timer)
    }
  }, [
    persistedPreflightId,
    persistedPreflightStatus,
    persistedWeatherPassed,
    runtimeItemsReady,
    runtimeStatus,
    weatherStatus?.safeToFly,
  ])

  useEffect(() => {
    if (
      validatedStoredCheckRef.current ||
      checkId ||
      triggering ||
      !runtimeStatus ||
      runtimeStatus.checkId === 'triggering'
    ) {
      return
    }
    validatedStoredCheckRef.current = true
    const storedCheckId = runtimeStatus.checkId
    if (persistedPreflightId && storedCheckId === persistedPreflightId) return
    let alive = true

    async function validateStoredPreflight() {
      try {
        const response = await fetch(
          `${controlBaseUrl}/api/preflight/${storedCheckId}`,
          { cache: 'no-store' },
        )
        if (!response.ok) throw new Error(`Stored preflight ${response.status}`)
        const payload = await response.json()
        if (!alive) return
        setRuntimeStatus(payload)
        writeStoredPreflightState(storageKey, payload, runtimeSessionId)
        void syncRuntimeStatusToBackend(payload, persistedPreflightId)
      } catch {
        if (!alive) return
        setCheckId(null)
      }
    }

    void validateStoredPreflight()
    return () => {
      alive = false
    }
  }, [
    checkId,
    missionId,
    runtimeSessionId,
    runtimeStatus,
    persistedPreflightId,
    storageKey,
    triggering,
  ])

  useEffect(() => {
    if (
      !canContinueToHandover ||
      isAlreadyInFlight ||
      backendPreflightRegisteredRef.current ||
      missionId === NO_MISSION_SENTINEL ||
      deviceId === NO_DRONE_SENTINEL
    ) {
      return
    }

    backendPreflightRegisteredRef.current = true
    let alive = true

    async function registerBackendPreflight() {
      setBackendPreflightRegistering(true)
      setBackendPreflightMessage(t.switchingToReady)
      try {
        if (!alive) return
        const completedPreflight = await missionApi.runPreflightCheck(
          missionId,
          deviceId,
        )
        window.sessionStorage.setItem(
          backendPreflightTokenStorageKey(missionId, deviceId),
          completedPreflight.flightToken?.tokenValue ??
            demoFlightToken(missionId, deviceId),
        )
        setBackendPreflightMessage(t.backendSwitchedReady)
      } catch (cause) {
        if (!alive) return
        backendPreflightRegisteredRef.current = false
        setBackendPreflightMessage(
          cause instanceof Error
            ? cause.message
            : t.backendPreflightUnconfirmed,
        )
      } finally {
        if (alive) setBackendPreflightRegistering(false)
      }
    }

    void registerBackendPreflight()

    return () => {
      alive = false
    }
  }, [canContinueToHandover, deviceId, isAlreadyInFlight, missionId])

  return (
    <div
      className="odm-card"
      style={{
        marginBottom: 0,
        height: embedded ? '100%' : undefined,
        display: embedded ? 'flex' : undefined,
        flexDirection: embedded ? 'column' : undefined,
        overflow: embedded ? 'hidden' : undefined,
      }}
    >
      <FlightStepHeader
        title={t.stepTitle}
        missionId={missionLabel ?? missionId}
        active={isAlreadyInFlight ? 5 : 3}
        right={
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              height: 32,
              padding: '0 12px',
              borderRadius: 16,
              background: 'var(--sf3)',
              fontWeight: 700,
              fontSize: 13,
              flex: 'none',
              maxWidth: 150,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {deviceId === NO_DRONE_SENTINEL
              ? t.noDroneAssigned
              : (deviceLabel ?? deviceId)}
          </span>
        }
      />
      <div
        style={{
          padding: '18px 22px',
          overflow: embedded ? 'auto' : undefined,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SummaryBanner
            nOk={nOk}
            nTotal={nTotal}
            progress={progress}
            isReady={canContinueToHandover}
            isFailed={isFailed}
            failedItems={failedItems}
            error={error}
            hasTriggered={hasTriggered}
            triggering={triggering}
            onTrigger={handleTriggerCheck}
            onReady={onReady}
            missionId={missionId}
            backendPreflightMessage={backendPreflightMessage}
            backendPreflightRegistering={backendPreflightRegistering}
          />
          <WeatherCheckPanel
            status={weatherStatus}
            form={weatherForm}
            suggesting={weatherSuggesting}
            error={weatherError}
            latitude={latitude}
            longitude={longitude}
            onFormChange={setWeatherForm}
            onSuggest={handleWeatherSuggestion}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {RUNTIME_GROUPS.map((group) => (
              <div
                key={group.title}
                style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    fontWeight: 700,
                    fontSize: 12.5,
                    color: 'var(--tx2)',
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                  }}
                >
                  <span>{group.title}</span>
                  {group.title.startsWith('2.') && (
                    <button
                      type="button"
                      className="odm-btn"
                      disabled={connectionChecking}
                      onClick={() => void handleConnectionControllerCheck()}
                      style={{ textTransform: 'none', letterSpacing: 0 }}
                    >
                      {connectionChecking
                        ? 'Đang kiểm tra…'
                        : '↻ Kiểm tra bộ điều khiển'}
                    </button>
                  )}
                </div>
                {group.title.startsWith('2.') && connectionCheckNotice && (
                  <div role="status" style={{ fontSize: 12, color: 'var(--tx2)' }}>
                    {connectionCheckNotice}
                  </div>
                )}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 10,
                  }}
                >
                  {group.items.map((def) => {
                    const state = itemStates[def.key] ?? { result: null }
                    const mediaFallback =
                      def.key === 'media_storage' &&
                      (state.status === 'FAIL' ||
                        state.status === 'UNKNOWN' ||
                        state.status === 'STALE')
                    const connectionFallback =
                      CONNECTION_MANUAL_FALLBACK_KEYS.has(def.key) &&
                      (state.status === 'FAIL' ||
                        state.status === 'UNKNOWN' ||
                        state.status === 'STALE')
                    return (
                      <RuntimePreflightItemRow
                        key={def.key}
                        def={def}
                        state={state}
                        manual={
                          MANUAL_DEVICE_KEYS.has(def.key) ||
                          mediaFallback ||
                          connectionFallback ||
                          (def.key === 'battery_health' &&
                            (state.status === 'FAIL' ||
                              state.status === 'UNKNOWN' ||
                              state.status === 'STALE'))
                        }
                        manualDisabled={!persistedPreflightId}
                        onManualChange={(result) =>
                          void handleManualCheck(def.key, result)
                        }
                        onBatteryRecheck={
                          def.key === 'battery_health'
                            ? () => void handleGazeboBatteryCheck()
                            : undefined
                        }
                        batteryChecking={batteryChecking}
                        batteryCheckNotice={batteryCheckNotice}
                        batteryFallback={
                          def.key === 'battery_health' &&
                          (state.status === 'FAIL' ||
                            state.status === 'UNKNOWN' ||
                            state.status === 'STALE')
                        }
                        batteryPercent={batteryPercentInput}
                        onBatteryPercentChange={setBatteryPercentInput}
                        onBatterySave={() => void handleSaveManualBattery()}
                        batterySaving={batterySaving}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryBanner({
  nOk,
  nTotal,
  progress,
  isReady,
  isFailed,
  failedItems,
  error,
  hasTriggered,
  triggering,
  onTrigger,
  onReady,
  missionId,
  backendPreflightMessage,
  backendPreflightRegistering,
}: {
  nOk: number
  nTotal: number
  progress: number
  isReady: boolean
  isFailed: boolean
  failedItems: PreflightItemDef[]
  error: string | null
  hasTriggered: boolean
  triggering: boolean
  onTrigger: () => void
  onReady?: () => void
  missionId: string
  backendPreflightMessage?: string | null
  backendPreflightRegistering?: boolean
}) {
  useI18n(preflightScreenMessages)
  const t = preflightScreenMessages.vi
  const bg = isFailed
    ? 'var(--red-bg)'
    : isReady
      ? 'var(--green-bg)'
      : 'var(--sf)'
  const border = isFailed
    ? 'var(--red-dot)'
    : isReady
      ? 'var(--green-dot)'
      : 'var(--bd)'
  const fg = isFailed
    ? 'var(--red-fg)'
    : isReady
      ? 'var(--green-fg)'
      : 'var(--tx)'

  return (
    <div
      style={{
        display: 'flex',
        gap: 18,
        alignItems: 'center',
        padding: '12px 18px',
        borderRadius: 14,
        background: bg,
        border: `1.5px solid ${border}`,
        color: fg,
      }}
    >
      <div style={{ minWidth: 150 }}>
        <div
          className="odm-mono"
          style={{ fontSize: 26, fontWeight: 700, lineHeight: 1 }}
        >
          {nOk}/{nTotal}
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{t.itemsPassed}</div>
      </div>
      <div style={{ flex: 1 }}>
        {isReady ? (
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{t.passReady}</div>
            {backendPreflightMessage ? (
              <div style={{ fontSize: 12.5, marginTop: 4 }}>
                {backendPreflightMessage}
              </div>
            ) : null}
          </div>
        ) : isFailed ? (
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            {t.failBlocked(failedItems.map((item) => item.label).join(', '))}
          </div>
        ) : (
          <div style={{ fontSize: 13.5 }}>
            {error ??
              (hasTriggered ? t.runningPrecheck(progress) : t.pressTriggerHint)}
          </div>
        )}
      </div>
      {isReady ? (
        onReady ? (
          <button
            type="button"
            className="odm-btn odm-btn-ok"
            onClick={onReady}
            disabled={backendPreflightRegistering}
            style={{ minWidth: 220 }}
          >
            {backendPreflightRegistering
              ? t.switchingToReady
              : t.continueToHandover}
          </button>
        ) : (
          <a
            className="odm-btn odm-btn-ok"
            href={operatorHref({ screen: 'missionDetail', missionId })}
            style={{ minWidth: 220 }}
          >
            {t.continueToHandover}
          </a>
        )
      ) : isFailed ? (
        <button
          type="button"
          className="odm-btn odm-btn-rd"
          onClick={onTrigger}
          disabled={triggering}
          style={{ minWidth: 200 }}
        >
          {triggering ? t.triggeringAgain : t.triggerAgain}
        </button>
      ) : !hasTriggered || error ? (
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={onTrigger}
          disabled={triggering}
          style={{ minWidth: 220 }}
        >
          {triggering ? t.triggeringAgain : t.triggerPrecheck}
        </button>
      ) : (
        <button
          type="button"
          className="odm-btn"
          disabled
          style={{ minWidth: 220 }}
        >
          {t.continueToHandover}
        </button>
      )}
    </div>
  )
}

function WeatherCheckPanel({
  status,
  form,
  suggesting,
  error,
  latitude,
  longitude,
  onFormChange,
  onSuggest,
}: {
  status: WeatherPreflightStatus | null
  form: WeatherObservationForm
  suggesting: boolean
  error: string | null
  latitude?: number | null
  longitude?: number | null
  onFormChange: (form: WeatherObservationForm) => void
  onSuggest: () => void
}) {
  useI18n(preflightScreenMessages)
  const t = preflightScreenMessages.vi
  const failed = status?.status === 'FAIL'
  const warned = status?.status === 'WARN'
  const passed = status?.status === 'PASS'
  const setField = (field: keyof WeatherObservationForm, value: string) => {
    onFormChange({ ...form, [field]: value })
  }
  const bg = failed
    ? 'var(--red-bg)'
    : warned
      ? '#fff7ed'
      : passed
        ? 'var(--green-bg)'
        : 'var(--sf)'
  const border = failed
    ? 'var(--red-dot)'
    : warned
      ? '#f59e0b'
      : passed
        ? 'var(--green-dot)'
        : 'var(--bd)'
  const fg = failed
    ? 'var(--red-fg)'
    : warned
      ? '#92400e'
      : passed
        ? 'var(--green-fg)'
        : 'var(--tx)'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        border: `1.5px solid ${border}`,
        background: bg,
        color: fg,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
          }}
        >
          <strong style={{ fontSize: 14.5 }}>{t.weatherTitle}</strong>
          <span
            style={{
              height: 24,
              padding: '0 10px',
              borderRadius: 999,
              display: 'inline-flex',
              alignItems: 'center',
              background: passed
                ? 'var(--green-solid)'
                : failed
                  ? 'var(--red-solid)'
                  : warned
                    ? '#f59e0b'
                    : 'var(--sf3)',
              color: passed || failed || warned ? '#fff' : 'var(--tx2)',
              fontSize: 11,
              fontWeight: 800,
            }}
          >
            {status ? status.status : t.weatherNotChecked}
          </span>
          {status && (
            <span style={{ fontSize: 12, color: 'inherit' }}>
              {t.weatherSummary(
                status.windSpeedMps.toFixed(1),
                status.windGustMps.toFixed(1),
                status.precipitationMmH.toFixed(1),
                status.visibilityKm.toFixed(1),
              )}
            </span>
          )}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: error ? 'var(--red-fg)' : 'var(--tx2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={error ?? status?.advisories.join(' ') ?? undefined}
        >
          {error ?? status?.summary ?? t.weatherHint}
          {status?.advisories?.[0] ? ` ${status.advisories[0]}` : ''}
        </div>
        <div
          style={{
            marginTop: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
            {typeof latitude === 'number' && typeof longitude === 'number'
              ? t.weatherCoordinateHint(
                  latitude.toFixed(6),
                  longitude.toFixed(6),
                )
              : t.weatherNoCoordinates}
          </span>
          <button
            type="button"
            className="odm-btn"
            onClick={onSuggest}
            disabled={suggesting}
            style={{
              minWidth: 210,
              background: '#fff',
              color: 'var(--blue-dot)',
              border: '1px solid var(--blue-dot)',
            }}
          >
            {suggesting ? t.weatherSuggesting : t.weatherSuggest}
          </button>
        </div>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          gap: 10,
        }}
      >
        <WeatherField
          label={t.weatherSource}
          value={form.source}
          placeholder={t.weatherSourcePlaceholder}
          onChange={(value) => setField('source', value)}
          style={{ gridColumn: 'span 2' }}
        />
        <WeatherField
          label={t.weatherObservedAt}
          type="datetime-local"
          value={form.observedAt}
          onChange={(value) => setField('observedAt', value)}
          style={{ gridColumn: 'span 2' }}
        />
        <WeatherField
          label={t.weatherWind}
          value={form.windSpeedMps}
          placeholder="0.0"
          suffix="m/s"
          onChange={(value) => setField('windSpeedMps', value)}
        />
        <WeatherField
          label={t.weatherGust}
          value={form.windGustMps}
          placeholder="0.0"
          suffix="m/s"
          onChange={(value) => setField('windGustMps', value)}
        />
        <WeatherField
          label={t.weatherRain}
          value={form.precipitationMmH}
          placeholder="0.0"
          suffix="mm/h"
          onChange={(value) => setField('precipitationMmH', value)}
        />
        <WeatherField
          label={t.weatherVisibility}
          value={form.visibilityKm}
          placeholder="0.0"
          suffix="km"
          onChange={(value) => setField('visibilityKm', value)}
        />
        <WeatherField
          label={t.weatherTemperature}
          value={form.temperatureC}
          placeholder="0.0"
          suffix="°C"
          onChange={(value) => setField('temperatureC', value)}
        />
        <WeatherField
          label={t.weatherHumidity}
          value={form.humidityPercent}
          placeholder="0"
          suffix="%"
          onChange={(value) => setField('humidityPercent', value)}
        />
        <label
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 5,
            gridColumn: 'span 2',
            fontSize: 12,
            fontWeight: 700,
            color: 'var(--tx2)',
          }}
        >
          {t.weatherDecision}
          <select
            value={form.decision}
            onChange={(event) =>
              onFormChange({
                ...form,
                decision: event.target.value as WeatherCheckStatus,
              })
            }
            style={{
              height: 38,
              border: '1px solid var(--bd)',
              borderRadius: 8,
              padding: '0 10px',
              background: '#fff',
              color: 'var(--tx)',
              fontWeight: 700,
            }}
          >
            <option value="PASS">{t.weatherDecisionPass}</option>
            <option value="WARN">{t.weatherDecisionWarn}</option>
            <option value="FAIL">{t.weatherDecisionFail}</option>
          </select>
        </label>
        <WeatherField
          label={t.weatherNotes}
          value={form.notes}
          placeholder={t.weatherNotesPlaceholder}
          onChange={(value) => setField('notes', value)}
          style={{ gridColumn: 'span 4' }}
        />
      </div>
    </div>
  )
}

function WeatherField({
  label,
  value,
  onChange,
  placeholder,
  suffix,
  type = 'text',
  style,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  suffix?: string
  type?: string
  style?: CSSProperties
}) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        minWidth: 0,
        fontSize: 12,
        fontWeight: 700,
        color: 'var(--tx2)',
        ...style,
      }}
    >
      {label}
      <span style={{ position: 'relative', display: 'block' }}>
        <input
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          style={{
            width: '100%',
            height: 38,
            border: '1px solid var(--bd)',
            borderRadius: 8,
            padding: suffix ? '0 48px 0 10px' : '0 10px',
            background: '#fff',
            color: 'var(--tx)',
            boxSizing: 'border-box',
          }}
        />
        {suffix ? (
          <span
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--tx3)',
              fontSize: 11,
              fontWeight: 700,
              pointerEvents: 'none',
            }}
          >
            {suffix}
          </span>
        ) : null}
      </span>
    </label>
  )
}

function RuntimePreflightItemRow({
  def,
  state,
  manual = false,
  manualDisabled = false,
  onManualChange,
  onBatteryRecheck,
  batteryChecking = false,
  batteryCheckNotice,
  batteryFallback = false,
  batteryPercent = '',
  onBatteryPercentChange,
  onBatterySave,
  batterySaving = false,
}: {
  def: PreflightItemDef
  state: ItemState
  manual?: boolean
  manualDisabled?: boolean
  onManualChange?: (result: PreflightItemResult) => void
  onBatteryRecheck?: () => void
  batteryChecking?: boolean
  batteryCheckNotice?: string | null
  batteryFallback?: boolean
  batteryPercent?: string
  onBatteryPercentChange?: (value: string) => void
  onBatterySave?: () => void
  batterySaving?: boolean
}) {
  useI18n(preflightScreenMessages)
  const t = preflightScreenMessages.vi
  const failed = state.result === 'fail'
  const passed = state.result === 'ok'
  return (
    <div
      style={{
        background: failed ? 'var(--red-bg)' : 'var(--sf)',
        border: `1.5px solid ${
          failed ? 'var(--red-dot)' : passed ? 'var(--green-dot)' : 'var(--bd)'
        }`,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '44px minmax(0, 1fr) 210px',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
            background: passed
              ? 'var(--green-bg)'
              : failed
                ? 'var(--red-solid)'
                : 'var(--sf3)',
            color: passed
              ? 'var(--green-fg)'
              : failed
                ? 'var(--red-on)'
                : 'var(--tx2)',
            fontWeight: 700,
          }}
        >
          {passed
            ? '✓'
            : failed
              ? '✕'
              : state.status === 'CHECKING'
                ? '◌'
                : '•'}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14.5, lineHeight: 1.2 }}>
            {def.label}
          </div>
          <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
            {def.detail}
          </div>
          <div style={{ marginTop: 3, fontSize: 11, color: 'var(--tx3)' }}>
            {state.measuredValue ? state.measuredValue : ''}
            {state.checkedAt
              ? ` · ${new Date(state.checkedAt).toLocaleString('vi-VN')}`
              : ''}
          </div>
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              color: failed ? 'var(--red-fg)' : 'var(--tx3)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={statusText(t, state.status, state.message)}
          >
            {statusText(t, state.status, state.message)}
          </div>
        </div>
        <div
          style={{
            justifySelf: 'end',
            display: 'flex',
            gap: 8,
          }}
        >
            <button
              type="button"
              className="odm-btn"
              aria-pressed={passed}
              disabled={!manual || manualDisabled}
              onClick={() => onManualChange?.('ok')}
              style={{
                minWidth: 84,
                background: passed ? 'var(--green-solid)' : undefined,
                color: passed ? 'var(--green-on)' : undefined,
                borderColor: passed ? 'var(--green-solid)' : undefined,
              }}
            >
              ✓ {t.itemPass}
            </button>
            <button
              type="button"
              className="odm-btn"
              aria-pressed={failed}
              disabled={!manual || manualDisabled}
              onClick={() => onManualChange?.('fail')}
              style={{
                minWidth: 104,
                background: failed ? 'var(--red-solid)' : undefined,
                color: failed ? 'var(--red-on)' : undefined,
                borderColor: failed ? 'var(--red-solid)' : undefined,
              }}
            >
              ✕ {t.itemFail}
            </button>
        </div>
      </div>
      {onBatteryRecheck && (
        <div
          style={{
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid var(--bd)',
            display: 'flex',
            gap: 8,
            alignItems: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            type="button"
            className="odm-btn"
            disabled={batteryChecking}
            onClick={onBatteryRecheck}
          >
            {batteryChecking ? 'Đang kiểm tra pin…' : '↻ Kiểm tra pin tự động'}
          </button>
          {batteryFallback && (
            <>
              <span style={{ fontSize: 12, color: 'var(--tx3)' }}>
                Không lấy được dữ liệu tự động — nhập mức pin thực tế:
              </span>
              <input
                aria-label="Phần trăm pin thủ công"
                type="number"
                min="0"
                max="100"
                step="1"
                value={batteryPercent}
                onChange={(event) => onBatteryPercentChange?.(event.currentTarget.value)}
                placeholder="0–100"
                style={{ width: 92, padding: '8px 10px' }}
              />
              <span style={{ fontWeight: 700 }}>%</span>
              <button
                type="button"
                className="odm-btn"
                disabled={batterySaving || batteryPercent.trim() === ''}
                onClick={onBatterySave}
              >
                {batterySaving ? 'Đang lưu…' : 'Lưu mức pin'}
              </button>
            </>
          )}
          {batteryCheckNotice && (
            <div
              role="status"
              style={{
                flexBasis: '100%',
                fontSize: 12,
                color: passed ? 'var(--green-fg)' : 'var(--tx2)',
              }}
            >
              {batteryCheckNotice}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
