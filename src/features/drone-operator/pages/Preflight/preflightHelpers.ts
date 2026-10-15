import type { PreflightItemKey } from '../../types/mission'
import type {
  ItemState,
  PersistedPreflightItemStatus,
  PersistedPreflightCheck,
  RuntimeCheck,
  RuntimePreflightStatus,
  RuntimeStatus,
  StoredPreflightStatus,
  StoredWeatherStatus,
  WeatherObservationForm,
  WeatherPreflightStatus,
} from './preflightTypes'

// Internal sentinel for "no mission selected" — never rendered, only used
// for control flow so it stays stable across language switches (unlike the
// translated `noMissionSelected` label, which is only for display).
export const NO_MISSION_SENTINEL = '__no_mission_selected__'
export const NO_DRONE_SENTINEL = '__no_drone_assigned__'

export const controlBaseUrl =
  import.meta.env.VITE_FLIGHT_CONTROL_API_URL ?? 'http://localhost:8090'

export const RUNTIME_KEY_MAP: Record<string, PreflightItemKey> = {
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

export function mapRuntimeToItems(checks: RuntimeCheck[]) {
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

export function preflightStateStorageKey(
  missionId: string,
  droneLabel: string,
) {
  return `omss.droneOperator.preflightState.${missionId}.${droneLabel}`
}

export function weatherStateStorageKey(missionId: string, droneLabel: string) {
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

export function readStoredPreflightState(storageKey: string) {
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

export function readStoredPreflightSession(storageKey: string) {
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

export function writeStoredPreflightState(
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

export function clearStoredPreflightState(storageKey: string) {
  try {
    window.localStorage.removeItem(storageKey)
  } catch {
    // The visible state still resets even if storage cleanup fails.
  }
}

export function runtimeStatusFromPersisted(
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

export function persistedStatusFromRuntime(
  status: RuntimeStatus,
): PersistedPreflightItemStatus {
  if (status === 'PASS' || status === 'WARN') return 'PASSED'
  if (status === 'FAIL') return 'FAILED'
  if (status === 'CHECKING') return 'CHECKING'
  return 'PENDING'
}

export function isWeatherStatus(
  value: unknown,
): value is WeatherPreflightStatus {
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

export function readStoredWeatherState(storageKey: string) {
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

export function writeStoredWeatherState(
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

export function weatherFormFromStatus(
  status: WeatherPreflightStatus | null,
): WeatherObservationForm {
  return {
    source:
      status?.advisories.find((item) => item.startsWith('Nguồn: '))?.slice(7) ??
      '',
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

export function isMissionInFlight(status?: string | null) {
  return (
    status === 'IN_FLIGHT' || status === 'IN_PROGRESS' || status === 'RETURNING'
  )
}

export function demoFlightToken(missionId: string, deviceId: string) {
  return `demo-flight-token:${missionId}:${deviceId}:${Date.now()}`
}
