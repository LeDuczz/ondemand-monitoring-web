import { useState } from 'react'

import { missionApi } from '../../mission/api/missionApi'
import { flightControlApi } from '../omss/api/flightControlApi'
import { useActiveMission } from '../api/useActiveMission'
import {
  ConnectStatusPanel,
} from './ConnectStatusPanel'
import { FlightStepHeader } from './FlightStepper'

export type ConnectState =
  'default' | 'connecting' | 'connected' | 'failed' | 'expired'

const GCS_OPTIONS = [
  'Flight Controller hiện tại',
]

/** OPR-04W — Kết nối drone: token/gcs form + trạng thái kết nối. */
export function ConnectDroneScreen() {
  const mission = useActiveMission()
  const [state, setState] = useState<ConnectState>('default')
  const [token, setToken] = useState('Flight token cấp sau preflight')
  const [gcsId, setGcsId] = useState(GCS_OPTIONS[0])
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setState('connecting')
    setError(null)
    try {
      if (!mission.missionId || !mission.data?.droneCode) throw new Error('Mission chưa được gán drone')
      await flightControlApi.bindSession(mission.missionId, mission.data.droneCode)
      if (mission.data.status === 'SCHEDULED') await missionApi.connectGcs(mission.missionId)
      setState('connected')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Không kết nối được Flight Controller')
      setState('failed')
    }
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title="Kết nối drone"
        missionId={mission.data?.missionCode ?? mission.missionId ?? 'Chưa chọn mission'}
        active={2}
        right={<DroneChip label={mission.data?.droneCode ?? 'Chưa gán drone'} />}
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
          <ConnectStatusPanel state={state} error={error} mission={mission.data} />
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
          <StepTitle n={1} text="Xác thực phiên operator" />
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
            <input
              className="odm-input odm-mono"
              value={token}
              disabled
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
            <button type="button" className="odm-btn" disabled style={{ height: 48 }}>
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
              drone_code được lấy từ mission đã gán
            </span>
            {isExpired ? (
              <span style={{ color: 'var(--red-fg)', fontWeight: 700 }}>
                Hết hạn lúc 13:24:12
              </span>
            ) : (
              <span style={{ color: 'var(--orange-fg)', fontWeight: 700 }}>Token cấp sau backend preflight</span>
            )}
          </div>
        </div>
      </div>

      <div className="odm-card" style={{ opacity: isExpired ? 0.55 : 1 }}>
        <div className="odm-card-body" style={{ padding: '16px 18px' }}>
          <StepTitle n={2} text="Kết nối Flight Controller" />
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
        Phiên điều khiển được xác thực bằng tài khoản operator và drone đã gán cho mission.
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
