import { useEffect, useMemo, useRef, useState } from 'react'

import { missionApi } from '../../mission/api/missionApi'
import { flightControlApi } from '../omss/api/flightControlApi'
import { useActiveMission } from '../api/useActiveMission'
import { operatorHref } from '../routes'
import type { PreflightItemKey, PreflightItemResult } from '../types/mission'
import { FlightStepHeader } from './FlightStepper'
import { PREFLIGHT_GROUPS, type PreflightItemDef } from './PreflightItem'

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

type StoredPreflightStatus = {
  savedAt: number
  status: RuntimePreflightStatus
}

type WeatherCheckStatus = 'PASS' | 'WARN' | 'FAIL'

type WeatherPreflightStatus = {
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

type ItemState = {
  result: PreflightItemResult | null
  detail?: string
  message?: string
  status?: RuntimeStatus
}

const ALL_ITEMS = PREFLIGHT_GROUPS.flatMap((group) => group.items)
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
    const key = RUNTIME_KEY_MAP[check.key]
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

function statusText(status?: RuntimeStatus, message?: string) {
  if (!status) return 'Chưa trigger precheck'
  if (status === 'PASS') return message || 'Đạt'
  if (status === 'WARN') return message || 'Cảnh báo nhưng không chặn bay'
  if (status === 'FAIL') return message || 'Không đạt'
  if (status === 'CHECKING') return message || 'Đang kiểm tra'
  return message || 'Đang chờ'
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

function writeStoredPreflightState(
  storageKey: string,
  status: RuntimePreflightStatus,
) {
  if (status.checkId === 'triggering') return
  try {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ savedAt: Date.now(), status } satisfies StoredPreflightStatus),
    )
  } catch {
    // Preflight still works if storage is unavailable.
  }
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
      JSON.stringify({ savedAt: Date.now(), status } satisfies StoredWeatherStatus),
    )
  } catch {
    // Weather check still works if storage is unavailable.
  }
}

export function PreflightScreen() {
  const mission = useActiveMission()
  const [startError, setStartError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  async function handleEnterSimulation() {
    if (!mission.missionId || !mission.data?.droneCode) { setStartError('Mission chưa được gán drone'); return }
    if (window.sessionStorage.getItem(`fieldwise.operator.handoverAcknowledged.${mission.missionId}`) !== 'true') {
      setStartError('Vui lòng xác nhận cam kết bàn giao trước khi bay')
      return
    }
    setStarting(true)
    setStartError(null)
    try {
      const droneCode = mission.data.droneCode
      await flightControlApi.bindSession(mission.missionId, droneCode)
      const deadline = Date.now() + 20_000
      while (true) {
        const telemetry = await missionApi.getTelemetryReadiness(mission.missionId)
        if (telemetry.droneCode !== droneCode) throw new Error('Drone của mission đã thay đổi. Kết nối lại GCS.')
        if (telemetry.ready) break
        if (Date.now() >= deadline) throw new Error('Chưa có telemetry mới từ drone. Kiểm tra Telemetry Sender và thử lại.')
        await new Promise((resolve) => window.setTimeout(resolve, 1000))
      }
      const check = await missionApi.runPreflightCheck(mission.missionId, droneCode)
      if (!check.overallPassed || !check.flightToken) throw new Error(check.failureReason || 'Backend preflight không đạt')
      await missionApi.handoverMyMission(mission.missionId)
      await missionApi.startMission(mission.missionId, check.flightToken.tokenValue)
      window.localStorage.setItem(
        `omss.droneOperator.preflightReady.${mission.data.missionCode ?? mission.missionId}.${droneCode}`,
        'true',
      )
      window.sessionStorage.setItem('odm.operator.autoStartSimulation', 'true')
      window.location.hash = operatorHref({ screen: 'flight' })
    } catch (cause) {
      setStartError(cause instanceof Error ? cause.message : 'Không bắt đầu được mission')
    } finally {
      setStarting(false)
    }
  }

  return <>
    {(mission.error || startError) && <p role="alert" style={{ color: 'var(--red-fg)' }}>{startError ?? (mission.error instanceof Error ? mission.error.message : 'Không tải được mission')}</p>}
    {starting && <p>Đang xác nhận telemetry, preflight và flight token…</p>}
    <PreflightChecklistPanel missionId={mission.data?.missionCode ?? mission.missionId ?? 'Chưa chọn mission'}
      droneLabel={mission.data?.droneCode ?? 'Chưa gán drone'}
      latitude={mission.data?.latitude ?? undefined} longitude={mission.data?.longitude ?? undefined}
      onReady={() => { void handleEnterSimulation() }} />
  </>
}

export function PreflightChecklistPanel({
  missionId,
  droneLabel,
  latitude,
  longitude,
  onReady,
  embedded = false,
}: {
  missionId: string
  droneLabel: string
  latitude?: number
  longitude?: number
  onReady?: () => void
  embedded?: boolean
}) {
  const storageKey = useMemo(
    () => preflightStateStorageKey(missionId, droneLabel),
    [droneLabel, missionId],
  )
  const weatherStorageKey = useMemo(
    () => weatherStateStorageKey(missionId, droneLabel),
    [droneLabel, missionId],
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
  const [error, setError] = useState<string | null>(null)
  const [triggering, setTriggering] = useState(false)
  const [weatherChecking, setWeatherChecking] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const validatedStoredCheckRef = useRef(false)

  const itemStates = useMemo(
    () => mapRuntimeToItems(runtimeStatus?.checks ?? []),
    [runtimeStatus],
  )
  const nOk = ALL_ITEMS.filter((item) => itemStates[item.key]?.result === 'ok')
    .length
  const nTotal = ALL_ITEMS.length
  const failedItems = ALL_ITEMS.filter(
    (item) => itemStates[item.key]?.result === 'fail',
  )
  const isReady = runtimeStatus?.status === 'READY'
  const isFailed = runtimeStatus?.status === 'FAILED'
  const progress = runtimeStatus?.progress ?? 0
  const hasTriggered = runtimeStatus !== null || checkId !== null || triggering

  async function handleTriggerCheck() {
    setTriggering(true)
    setError(null)
    setCheckId(null)
    try {
      window.localStorage.removeItem(storageKey)
    } catch {
      // Ignore storage cleanup failures.
    }
    setRuntimeStatus({
      checkId: 'triggering',
      status: 'CHECKING',
      progress: 0,
      checks: [],
    })

    try {
      const response = await fetch(`${controlBaseUrl}/api/preflight/check`, {
        method: 'POST',
      })
      if (!response.ok) throw new Error(`Preflight API ${response.status}`)
      const payload = await response.json()
      setCheckId(payload.checkId)
    } catch {
      setRuntimeStatus(null)
      setError('Không gọi được API trigger precheck. Hãy mở Drone Stack rồi bấm Trigger lại.')
    } finally {
      setTriggering(false)
    }
  }

  async function handleWeatherCheck() {
    setWeatherChecking(true)
    setWeatherError(null)

    try {
      const response = await fetch(`${controlBaseUrl}/api/weather/preflight-check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          missionId,
          droneCode: droneLabel,
          latitude,
          longitude,
        }),
      })
      if (!response.ok) throw new Error(`Weather API ${response.status}`)
      const payload = await response.json()
      const nextStatus = payload.data ?? payload
      if (!isWeatherStatus(nextStatus)) throw new Error('Invalid weather payload')
      setWeatherStatus(nextStatus)
      writeStoredWeatherState(weatherStorageKey, nextStatus)
    } catch {
      setWeatherError('Không gọi được API thời tiết. Kiểm tra backend rồi bấm lại.')
    } finally {
      setWeatherChecking(false)
    }
  }

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
        writeStoredPreflightState(storageKey, payload)
        if (payload.status === 'READY' || payload.status === 'FAILED') {
          setCheckId(null)
        }
      } catch {
        if (!alive) return
        setError('Mất kết nối precheck API. Bấm Trigger precheck để chạy lại.')
        setCheckId(null)
      }
    }

    void poll()
    const timer = window.setInterval(poll, 800)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [checkId, storageKey])

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
        writeStoredPreflightState(storageKey, payload)
      } catch {
        if (!alive) return
        try {
          window.localStorage.removeItem(storageKey)
        } catch {
          // Ignore storage cleanup failures.
        }
        setRuntimeStatus(null)
        setError(null)
      }
    }

    void validateStoredPreflight()
    return () => {
      alive = false
    }
  }, [checkId, runtimeStatus, storageKey, triggering])

  useEffect(() => {
    if (!runtimeStatus && !weatherStatus) return
    let alive = true

    async function checkDroneTerminalOnline() {
      try {
        const response = await fetch(`${controlBaseUrl}/api/control/status`, {
          cache: 'no-store',
        })
        if (!response.ok) throw new Error(`Control status ${response.status}`)
      } catch {
        if (!alive) return
        try {
          window.localStorage.removeItem(storageKey)
          window.localStorage.removeItem(weatherStorageKey)
        } catch {
          // Ignore storage cleanup failures.
        }
        setCheckId(null)
        setRuntimeStatus(null)
        setWeatherStatus(null)
        setError(null)
        setWeatherError(null)
      }
    }

    void checkDroneTerminalOnline()
    const timer = window.setInterval(checkDroneTerminalOnline, 2000)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [runtimeStatus, storageKey, weatherStatus, weatherStorageKey])

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
        title="Preflight checklist"
        missionId={missionId}
        active={4}
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
            {droneLabel}
          </span>
        }
      />
      <div style={{ padding: '18px 22px', overflow: embedded ? 'auto' : undefined }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SummaryBanner
            nOk={nOk}
            nTotal={nTotal}
            progress={progress}
            isReady={isReady}
            isFailed={isFailed}
            failedItems={failedItems}
            error={error}
            hasTriggered={hasTriggered}
            triggering={triggering}
            onTrigger={handleTriggerCheck}
            onReady={onReady}
          />
          <WeatherCheckPanel
            status={weatherStatus}
            checking={weatherChecking}
            error={weatherError}
            onCheck={handleWeatherCheck}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {PREFLIGHT_GROUPS.map((group) => (
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
}) {
  const bg = isFailed ? 'var(--red-bg)' : isReady ? 'var(--green-bg)' : 'var(--sf)'
  const border = isFailed
    ? 'var(--red-dot)'
    : isReady
      ? 'var(--green-dot)'
      : 'var(--bd)'
  const fg = isFailed ? 'var(--red-fg)' : isReady ? 'var(--green-fg)' : 'var(--tx)'

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
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>mục đạt</div>
      </div>
      <div style={{ flex: 1 }}>
        {isReady ? (
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            PASS · đủ điều kiện cất cánh
          </div>
        ) : isFailed ? (
          <div style={{ fontSize: 18, fontWeight: 700 }}>
            FAIL · CHẶN BAY · Không đạt:{' '}
            <b>{failedItems.map((item) => item.label).join(', ')}</b>
          </div>
        ) : (
          <div style={{ fontSize: 13.5 }}>
            {error ??
              (hasTriggered
                ? `Đang chạy precheck... ${progress}%`
                : 'Bấm Trigger precheck để gọi API kiểm tra drone.')}
          </div>
        )}
      </div>
      {isReady ? (
        onReady ? (
          <button
            type="button"
            className="odm-btn odm-btn-ok"
            onClick={onReady}
            style={{ minWidth: 220 }}
          >
            Tiếp tục tới buồng lái
          </button>
        ) : (
          <a
            className="odm-btn odm-btn-ok"
            href={operatorHref({ screen: 'flight' })}
            style={{ minWidth: 220 }}
          >
            Tiếp tục tới buồng lái
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
          {triggering ? 'Đang trigger...' : 'Trigger lại precheck'}
        </button>
      ) : !hasTriggered || error ? (
        <button
          type="button"
          className="odm-btn odm-btn-p"
          onClick={onTrigger}
          disabled={triggering}
          style={{ minWidth: 220 }}
        >
          {triggering ? 'Đang trigger...' : 'Trigger precheck'}
        </button>
      ) : (
        <button
          type="button"
          className="odm-btn"
          disabled
          style={{ minWidth: 220 }}
        >
          Tiếp tục tới buồng lái
        </button>
      )}
    </div>
  )
}

function WeatherCheckPanel({
  status,
  checking,
  error,
  onCheck,
}: {
  status: WeatherPreflightStatus | null
  checking: boolean
  error: string | null
  onCheck: () => void
}) {
  const failed = status?.status === 'FAIL'
  const warned = status?.status === 'WARN'
  const passed = status?.status === 'PASS'
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
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) auto',
        alignItems: 'center',
        gap: 14,
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
          <strong style={{ fontSize: 14.5 }}>Thời tiết bay</strong>
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
            {status ? status.status : 'CHƯA CHECK'}
          </span>
          {status && (
            <span style={{ fontSize: 12, color: 'inherit' }}>
              Gió {status.windSpeedMps.toFixed(1)} m/s · Giật{' '}
              {status.windGustMps.toFixed(1)} m/s · Mưa{' '}
              {status.precipitationMmH.toFixed(1)} mm/h · Tầm nhìn{' '}
              {status.visibilityKm.toFixed(1)} km
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
          {error ??
            status?.summary ??
            'Bấm Check thời tiết để kiểm tra điều kiện gió, mưa và tầm nhìn trước khi bay.'}
          {status?.advisories?.[0] ? ` ${status.advisories[0]}` : ''}
        </div>
      </div>
      <button
        type="button"
        className={passed ? 'odm-btn odm-btn-ok' : 'odm-btn odm-btn-p'}
        onClick={onCheck}
        disabled={checking}
        style={{ minWidth: 170 }}
      >
        {checking ? 'Đang check...' : status ? 'Check lại thời tiết' : 'Check thời tiết'}
      </button>
    </div>
  )
}

function RuntimePreflightItemRow({
  def,
  state,
}: {
  def: PreflightItemDef
  state: ItemState
}) {
  const failed = state.result === 'fail'
  const passed = state.result === 'ok'
  const checking = state.status === 'CHECKING'
  const tone = failed
    ? {
        label: 'Không đạt',
        bg: 'var(--red-solid)',
        fg: 'var(--red-on)',
        border: 'var(--red-solid)',
      }
    : passed
      ? {
          label: 'Đạt',
          bg: 'var(--green-solid)',
          fg: 'var(--green-on)',
          border: 'var(--green-solid)',
        }
      : {
          label: checking ? 'Đang kiểm' : 'Chờ kiểm',
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
      <div style={{ display: 'grid', gridTemplateColumns: '44px minmax(0, 1fr) 104px', alignItems: 'center', gap: 12 }}>
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
          {passed ? '✓' : failed ? '✕' : state.status === 'CHECKING' ? '◌' : '•'}
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
            title={statusText(state.status, state.message)}
          >
            {statusText(state.status, state.message)}
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
