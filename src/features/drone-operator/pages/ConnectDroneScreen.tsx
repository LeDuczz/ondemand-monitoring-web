import { useState } from 'react'

import { useI18n } from '../../../shared/i18n'
import { missionApi } from '../../mission/api/missionApi'
import { flightControlApi } from '../omss/api/flightControlApi'
import { useActiveMission } from '../api/useActiveMission'
import { ConnectStatusPanel } from './ConnectStatusPanel'
import { FlightStepHeader } from './FlightStepper'
import { connectDroneScreenMessages } from './ConnectDroneScreen.messages'

export type ConnectState =
  'default' | 'connecting' | 'connected' | 'failed' | 'expired'

/** OPR-04W — Kết nối thiết bị: token/gcs form + trạng thái kết nối. */
export function ConnectDroneScreen({ missionId }: { missionId?: string }) {
  const mission = useActiveMission(missionId)
  const { t } = useI18n(connectDroneScreenMessages)
  const [state, setState] = useState<ConnectState>('default')
  const [token, setToken] = useState(t.tokenPlaceholder)
  const [gcsId, setGcsId] = useState(t.gcsOptions[0])
  const [error, setError] = useState<string | null>(null)

  async function handleConnect() {
    setState('connecting')
    setError(null)
    try {
      const data = mission.data
      const deviceId = data?.deviceId
      if (!mission.missionId || !deviceId)
        throw new Error(t.noMissionAssigned)
      await flightControlApi.bindSession(
        mission.missionId,
        deviceId,
      )
      if (data?.status === 'SCHEDULED')
        await missionApi.connectGcs(mission.missionId)
      setState('connected')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.connectFailed)
      setState('failed')
    }
  }

  return (
    <div className="odm-card" style={{ marginBottom: 0 }}>
      <FlightStepHeader
        title={t.stepTitle}
        missionId={
          mission.data?.missionCode ?? mission.missionId ?? t.noMissionSelected
        }
        active={2}
        right={
          <DroneChip
            label={
              mission.data?.deviceId ?? t.noDroneAssigned
            }
          />
        }
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
          <ConnectStatusPanel
            state={state}
            error={error}
            mission={mission.data}
          />
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
  const { t } = useI18n(connectDroneScreenMessages)
  const isConnecting = state === 'connecting'
  const isConnected = state === 'connected'
  const isExpired = state === 'expired'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="odm-card">
        <div className="odm-card-body" style={{ padding: '16px 18px' }}>
          <StepTitle n={1} text={t.step1Title} />
          <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
            <input
              className="odm-input odm-mono"
              value={token}
              disabled
              onChange={(e) => onTokenChange(e.target.value)}
              aria-label={t.tokenAriaLabel}
              style={{
                height: 48,
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '.08em',
                textAlign: 'center',
                flex: 1,
              }}
            />
            <button
              type="button"
              className="odm-btn"
              disabled
              style={{ height: 48 }}
            >
              {t.scanQr}
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
            <span style={{ color: 'var(--tx3)' }}>{t.droneCodeHint}</span>
            {isExpired ? (
              <span style={{ color: 'var(--red-fg)', fontWeight: 700 }}>
                {t.expiredAt}
              </span>
            ) : (
              <span style={{ color: 'var(--orange-fg)', fontWeight: 700 }}>
                {t.tokenAfterPreflight}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="odm-card" style={{ opacity: isExpired ? 0.55 : 1 }}>
        <div className="odm-card-body" style={{ padding: '16px 18px' }}>
          <StepTitle n={2} text={t.step2Title} />
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              className="odm-input"
              aria-label={t.gcsAriaLabel}
              value={gcsId}
              disabled={isExpired}
              onChange={(e) => onGcsChange(e.target.value)}
              style={{ flex: 1, height: 44 }}
            >
              {t.gcsOptions.map((opt) => (
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
                {t.requestNewCode}
              </button>
            ) : isConnected ? (
              <button
                type="button"
                className="odm-btn"
                disabled
                style={{ height: 44, minWidth: 150 }}
              >
                {t.connected}
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
                  ? t.connecting
                  : state === 'failed'
                    ? t.retry
                    : t.connect}
              </button>
            )}
          </div>
        </div>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--tx3)' }}>{t.sessionNote}</div>
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
