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

type PersistedPreflightItemStatus = 'PENDING' | 'CHECKING' | 'PASSED' | 'FAILED'
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
  }>
}

type PersistedPreflightUpdate = {
  status: PersistedPreflightItemStatus
  message: string
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
}

const RUNTIME_KEY_MAP: Record<string, PreflightItemKey> = {
  GAZEBO: 'gazebo',
  PX4: 'px4',
  MAVSDK: 'mavsdk',
  PX4_CONTROL: 'px4Control',
  LOCAL_POSITION: 'localPosition',
  MAVSDK_HEALTH: 'mavsdkHealth',
  BATTERY: 'battery',
  LIDAR: 'lidar',
  CAMERA: 'camera',
  BACKEND: 'backend',
  MEDIA: 'media',
  MODULES: 'modules',
}

function mapRuntimeToItems(checks: RuntimeCheck[]) {
  const mapped: Partial<Record<PreflightItemKey, ItemState>> = {}

  for (const check of checks) {
    const key =
      RUNTIME_KEY_MAP[check.key] ??
      (ALL_PREFLIGHT_KEYS.includes(check.key as PreflightItemKey)
        ? (check.key as PreflightItemKey)
        : undefined)
    if (!key) continue

    const current = mapped[key]
    const result =
      check.status === 'PASS' || check.status === 'WARN'
        ? 'ok'
        : check.status === 'FAIL'
          ? 'fail'
          : null

    if (!current || current.result !== 'fail') {
      mapped[key] = {
        result,
        status: check.status,
        message: check.message,
      }
    }
  }

  return mapped
}

const ALL_PREFLIGHT_KEYS: PreflightItemKey[] = [
  'battery',
  'camera',
  'lidar',
  'px4',
  'mavsdk',
  'px4Control',
  'mavsdkHealth',
  'backend',
  'media',
]

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
          : item.status === 'FAILED'
            ? 'FAIL'
            : item.status,
      message: item.message ?? '',
      critical: item.checkLevel === 'CRITICAL',
    })),
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
  const { t } = useI18n(preflightScreenMessages)
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
  const { t, lang } = useI18n(preflightScreenMessages)
  const PREFLIGHT_GROUPS = useMemo(() => preflightGroups(lang), [lang])
  const RUNTIME_GROUPS = useMemo(
    () =>
      PREFLIGHT_GROUPS
        .map((group) => ({
          ...group,
          items: group.items.filter((item) =>
            Object.values(RUNTIME_KEY_MAP).includes(item.key),
          ),
        }))
        .filter((group) => group.items.length > 0),
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
  const [controllerOnline, setControllerOnline] = useState(false)
  const [runtimeSessionId, setRuntimeSessionId] = useState<string | null>(() =>
    readStoredPreflightSession(storageKey),
  )
  const [persistedPreflightId, setPersistedPreflightId] = useState<
    string | null
  >(null)
  const [persistedPreflightStatus, setPersistedPreflightStatus] =
    useState<PersistedPreflightStatus | null>(null)
  const [persistedWeatherPassed, setPersistedWeatherPassed] = useState(false)
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
    const storedWeather = readStoredWeatherState(weatherStorageKey)
    setWeatherStatus(storedWeather)
    setWeatherForm(weatherFormFromStatus(storedWeather))
    setRuntimeSessionId(readStoredPreflightSession(storageKey))
  }, [missionId, deviceId, storageKey, weatherStorageKey])

  const itemStates = useMemo(
    () => mapRuntimeToItems(runtimeStatus?.checks ?? []),
    [runtimeStatus],
  )
  const nOk = ALL_ITEMS.filter(
    (item) => itemStates[item.key]?.result === 'ok',
  ).length
  const nTotal = ALL_ITEMS.length
  const failedItems = ALL_ITEMS.filter(
    (item) => itemStates[item.key]?.result === 'fail',
  )
  const runtimeItemsReady = nOk === nTotal && failedItems.length === 0
  const weatherReady =
    weatherStatus?.safeToFly === true || persistedWeatherPassed
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

  useEffect(() => {
    if (!persistedPreflightId || !weatherStatus) return

    const itemStatus: PersistedPreflightItemStatus = weatherStatus.safeToFly
      ? 'PASSED'
      : 'FAILED'
    const syncKey = `WEATHER:${itemStatus}:${weatherStatus.summary}`
    if (syncedPersistedItemsRef.current.WEATHER === syncKey) return

    let alive = true
    syncedPersistedItemsRef.current.WEATHER = syncKey

    updatePersistedPreflightItem(persistedPreflightId, 'WEATHER', {
      status: itemStatus,
      message: weatherStatus.summary,
    })
      .then((persisted) => {
        if (!alive || persisted.id !== persistedPreflightId) return
        setPersistedPreflightStatus(persisted.status)
        setPersistedWeatherPassed(itemStatus === 'PASSED')
      })
      .catch(() => {
        if (alive) delete syncedPersistedItemsRef.current.WEATHER
      })

    return () => {
      alive = false
    }
  }, [persistedPreflightId, weatherStatus])

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
      const response = await fetch(`${controlBaseUrl}/api/preflight/check`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error(`Preflight API ${response.status}`)
      const payload = await response.json()
      setCheckId(payload.checkId)
      setPersistedPreflightId(payload.checkId)
      setPersistedPreflightStatus('CHECKING')
    } catch {
      setRuntimeStatus(null)
      setError(t.triggerFailed)
    } finally {
      setTriggering(false)
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
                item.checkType === 'WEATHER' && item.status === 'PASSED',
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
    if (!controllerOnline) return
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
          (item) => item.checkType === 'WEATHER' && item.status === 'PASSED',
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
  }, [controllerOnline, missionId, runtimeSessionId, storageKey])

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
          (item) => item.checkType === 'WEATHER' && item.status === 'PASSED',
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
                    fontWeight: 700,
                    fontSize: 12.5,
                    color: 'var(--tx2)',
                    textTransform: 'uppercase',
                    letterSpacing: '.04em',
                  }}
                >
                  {group.title}
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 10,
                  }}
                >
                  {group.items.map((def) => (
                    <RuntimePreflightItemRow
                      key={def.key}
                      def={def}
                      state={itemStates[def.key] ?? { result: null }}
                    />
                  ))}
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
  const { t } = useI18n(preflightScreenMessages)
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
  const { t } = useI18n(preflightScreenMessages)
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
}: {
  def: PreflightItemDef
  state: ItemState
}) {
  const { t } = useI18n(preflightScreenMessages)
  const failed = state.result === 'fail'
  const passed = state.result === 'ok'
  const checking = state.status === 'CHECKING'
  const tone = failed
    ? {
        label: t.itemFail,
        bg: 'var(--red-solid)',
        fg: 'var(--red-on)',
        border: 'var(--red-solid)',
      }
    : passed
      ? {
          label: t.itemPass,
          bg: 'var(--green-solid)',
          fg: 'var(--green-on)',
          border: 'var(--green-solid)',
        }
      : {
          label: checking ? t.itemChecking : t.itemPending,
          bg: 'var(--sf3)',
          fg: 'var(--tx2)',
          border: 'var(--bd2)',
        }

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
          gridTemplateColumns: '44px minmax(0, 1fr) 104px',
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
            {def.detail ? `${def.detail} · ` : ''}
            <span className="odm-mono">{def.code}</span>
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
        <span
          style={{
            justifySelf: 'end',
            minWidth: 94,
            height: 32,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            border: `1px solid ${tone.border}`,
            background: tone.bg,
            color: tone.fg,
            fontSize: 12,
            fontWeight: 800,
            whiteSpace: 'nowrap',
          }}
        >
          {tone.label}
        </span>
      </div>
    </div>
  )
}
