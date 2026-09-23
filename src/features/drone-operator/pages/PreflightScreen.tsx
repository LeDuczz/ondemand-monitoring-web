import { useEffect, useMemo, useState } from 'react'

import { operatorHref } from '../routes'
import type { PreflightItemKey, PreflightItemResult } from '../types/mission'
import { FlightStepHeader } from './FlightStepper'
import { PREFLIGHT_GROUPS, type PreflightItemDef } from './PreflightItem'

const MISSION_ID = 'MSN-2609-0142-1'
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
  if (!status) return 'Đang chờ API precheck'
  if (status === 'PASS') return message || 'Đạt'
  if (status === 'WARN') return message || 'Cảnh báo nhưng không chặn bay'
  if (status === 'FAIL') return message || 'Không đạt'
  if (status === 'CHECKING') return message || 'Đang kiểm tra'
  return message || 'Đang chờ'
}

export function PreflightScreen() {
  const [checkId, setCheckId] = useState<string | null>(null)
  const [runtimeStatus, setRuntimeStatus] =
    useState<RuntimePreflightStatus | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retrySeed, setRetrySeed] = useState(0)

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

  useEffect(() => {
    let alive = true
    let retryTimer: number | undefined

    async function startPreflight() {
      setError(null)
      setRuntimeStatus({
        checkId: 'connecting',
        status: 'CHECKING',
        progress: 0,
        checks: [],
      })
      setCheckId(null)

      try {
        const response = await fetch(`${controlBaseUrl}/api/preflight/check`, {
          method: 'POST',
        })
        if (!response.ok) throw new Error(`Preflight API ${response.status}`)
        const payload = await response.json()
        if (!alive) return
        setCheckId(payload.checkId)
      } catch {
        if (!alive) return
        setError(
          'Đang chờ flight controller precheck API. Hãy mở Drone Stack, màn hình sẽ tự chạy tiếp.',
        )
        retryTimer = window.setTimeout(startPreflight, 1500)
      }
    }

    void startPreflight()
    return () => {
      alive = false
      if (retryTimer) window.clearTimeout(retryTimer)
    }
  }, [retrySeed])

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
      } catch {
        if (!alive) return
        setError('Mất kết nối precheck API, đang thử lại...')
        setCheckId(null)
        setRetrySeed((value) => value + 1)
      }
    }

    void poll()
    const timer = window.setInterval(poll, 800)
    return () => {
      alive = false
      window.clearInterval(timer)
    }
  }, [checkId])

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title="Preflight checklist"
        missionId={MISSION_ID}
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
            }}
          >
            DRN-02 Hải Âu
          </span>
        }
      />
      <div style={{ padding: '18px 22px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <SummaryBanner
            nOk={nOk}
            nTotal={nTotal}
            progress={progress}
            isReady={isReady}
            isFailed={isFailed}
            failedItems={failedItems}
            error={error}
            onRetry={() => setRetrySeed((value) => value + 1)}
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
  onRetry,
}: {
  nOk: number
  nTotal: number
  progress: number
  isReady: boolean
  isFailed: boolean
  failedItems: PreflightItemDef[]
  error: string | null
  onRetry: () => void
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
            {error ?? `Đang chạy precheck tự động... ${progress}%`}
          </div>
        )}
      </div>
      {isReady ? (
        <a
          className="odm-btn odm-btn-ok"
          href={operatorHref({ screen: 'flight' })}
          style={{ minWidth: 220 }}
        >
          Tiếp tục tới buồng lái
        </a>
      ) : isFailed ? (
        <button
          type="button"
          className="odm-btn odm-btn-rd"
          onClick={onRetry}
          style={{ minWidth: 200 }}
        >
          Chạy lại precheck
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
