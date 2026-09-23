import { useState } from 'react'

import { operatorApi } from '../api/operatorApi'
import {
  ConnectStatusPanel,
  DRONE_LABEL,
  MISSION_ID,
} from './ConnectStatusPanel'
import { FlightStepHeader } from './FlightStepper'

export type ConnectState =
  'default' | 'connecting' | 'connected' | 'failed' | 'expired'

const GCS_OPTIONS = [
  'DJI-RC-PLUS-7A31 (điều khiển cầm tay)',
  'GCS-CLOUD-BTHANH-01 (trạm Bình Thạnh)',
  'Nhập mã khác...',
]

/** OPR-04W — Kết nối drone: token/gcs form + trạng thái kết nối. */
export function ConnectDroneScreen() {
  const [state, setState] = useState<ConnectState>('default')
  const [token, setToken] = useState('K7F2-9QXM-D3TR')
  const [gcsId, setGcsId] = useState(GCS_OPTIONS[0])
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setState('connecting')
    setError(null)
    try {
      await operatorApi.connectGCS(MISSION_ID, { token, gcsId })
      setState('connected')
    } catch {
      setError(
        'GCS không phản hồi heartbeat trong 10 giây (ERR_HEARTBEAT_TIMEOUT)',
      )
      setState('failed')
    }
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title="Kết nối drone"
        missionId={MISSION_ID}
        active={2}
        right={<DroneChip label={DRONE_LABEL} />}
      />
      <div style={{ padding: '18px 22px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0,1.25fr) minmax(0,1fr)',
            gap: 18,
            alignItems: 'start',
          }}
        >
          <ConnectForm
            state={state}
            token={token}
            gcsId={gcsId}
            onTokenChange={setToken}
            onGcsChange={setGcsId}
            onConnect={handleConnect}
            onRetryExpired={() => setState('default')}
          />
          <ConnectStatusPanel state={state} error={error} />
        </div>
      </div>
    </div>
  )
}

function ConnectForm({
  state,
  token,
  gcsId,
  onTokenChange,
  onGcsChange,
  onConnect,
  onRetryExpired,
}: {
  state: ConnectState
  token: string
  gcsId: string
  onTokenChange: (v: string) => void
  onGcsChange: (v: string) => void
  onConnect: () => void
  onRetryExpired: () => void
}) {
  const isConnecting = state === 'connecting'
  const isConnected = state === 'connected'
  const isExpired = state === 'expired'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="odm-card">
        <div className="odm-card-body" style={{ padding: '16px 18px' }}>
          <StepTitle n={1} text="Nhập hoặc quét mã flight_token" />
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
            <input
              className="odm-input odm-mono"
              value={token}
              disabled={isExpired}
              onChange={(e) => onTokenChange(e.target.value)}
              aria-label="Mã flight token"
              style={{
                height: 48,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '.08em',
                textAlign: 'center',
                flex: 1,
              }}
            />
            <button type="button" className="odm-btn" style={{ height: 48 }}>
              Quét QR
            </button>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 10,
              fontSize: 13,
            }}
          >
            <span style={{ color: 'var(--tx3)' }}>
              device_code <b className="odm-mono">TAB-OPR-0412</b>
            </span>
            {isExpired ? (
              <span style={{ color: 'var(--red-fg)', fontWeight: 700 }}>
                Hết hạn lúc 13:24:12
              </span>
            ) : (
              <span style={{ color: 'var(--orange-fg)', fontWeight: 700 }}>
                expires_at · còn <span className="odm-mono">04:37</span>
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="odm-card" style={{ opacity: isExpired ? 0.55 : 1 }}>
        <div className="odm-card-body" style={{ padding: '16px 18px' }}>
          <StepTitle n={2} text="Chọn hoặc nhập gcs_identifier" />
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              className="odm-input"
              aria-label="GCS"
              value={gcsId}
              disabled={isExpired}
              onChange={(e) => onGcsChange(e.target.value)}
              style={{ flex: 1, height: 44 }}
            >
              {GCS_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {isExpired ? (
              <button
                type="button"
                className="odm-btn odm-btn-p"
                onClick={onRetryExpired}
                style={{ height: 44 }}
              >
                Yêu cầu mã mới
              </button>
            ) : isConnected ? (
              <button
                type="button"
                className="odm-btn"
                disabled
                style={{ height: 44, minWidth: 150 }}
              >
                Đã kết nối
              </button>
            ) : (
              <button
                type="button"
                className="odm-btn odm-btn-p"
                onClick={onConnect}
                disabled={isConnecting}
                style={{ height: 44, minWidth: 150 }}
              >
                {isConnecting
                  ? 'Đang kết nối...'
                  : state === 'failed'
                    ? 'Thử lại'
                    : 'Kết nối'}
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>
        Ghi vào flight_connection và đặt flight_token.used_at khi kết nối thành
        công.
      </div>
    </div>
  )
}

function DroneChip({ label }: { label: string }) {
  return (
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
      {label}
    </span>
  )
}

function StepTitle({ n, text }: { n: number; text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
      }}
    >
      <span
        style={{
          width: 28,
          height: 28,
          borderRadius: '50%',
          background: 'var(--ink)',
          color: 'var(--inkfg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 12.5,
          flex: 'none',
        }}
      >
        {n}
      </span>
      <span style={{ fontWeight: 700, fontSize: 15.5 }}>{text}</span>
    </div>
  )
}
