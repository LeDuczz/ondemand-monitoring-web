import { useState } from 'react'
import type { Mission, Drone } from '../types'

interface Props {
  mission: Mission
  drone: Drone
  onConnected: () => void
  onBack: () => void
}

type Phase = 'idle' | 'discover' | 'handshake' | 'sync' | 'done' | 'fail'

const STEPS = [
  {
    id: 'discover',
    label: 'Discover drone',
    detail: 'Scanning MAVLink endpoints',
  },
  {
    id: 'handshake',
    label: 'Establish link',
    detail: 'Negotiating heartbeat protocol',
  },
  {
    id: 'sync',
    label: 'Sync parameters',
    detail: 'Downloading flight parameters',
  },
  { id: 'done', label: 'Connection ready', detail: 'GCS link established' },
]

interface LogEntry {
  t: string
  msg: string
  ok: boolean
}

export default function GCSConnection({
  mission,
  drone,
  onConnected,
  onBack,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [log, setLog] = useState<LogEntry[]>([])

  function ts() {
    return new Date().toISOString().slice(11, 22)
  }
  function addLog(msg: string, ok = true) {
    setLog((prev) => [...prev, { t: ts(), msg, ok }])
  }

  function start() {
    setPhase('discover')
    addLog('Initiating GCS connection…')
    setTimeout(() => {
      addLog(
        `Drone ${drone.id} found at 192.168.1.${Math.floor(Math.random() * 200 + 50)}`,
      )
      setPhase('handshake')
    }, 1200)
    setTimeout(() => {
      addLog('MAVLink heartbeat established')
      setPhase('sync')
    }, 2400)
    setTimeout(() => {
      addLog('Downloading 247 parameters')
    }, 3000)
    setTimeout(() => {
      addLog('Parameter sync complete — 247/247')
      setPhase('done')
      addLog('GCS link ready ✓')
    }, 4200)
  }

  const stepsDone = {
    idle: 0,
    discover: 0,
    handshake: 1,
    sync: 2,
    done: 4,
    fail: 0,
  }[phase]

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: 'var(--text-2)',
          fontSize: 13,
          cursor: 'pointer',
          padding: 0,
          marginBottom: 20,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M9 2L4 7l5 5" />
        </svg>
        Mission detail
      </button>

      <div style={{ maxWidth: 560 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 6px',
          }}
        >
          GCS connection
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 28px' }}>
          Connecting to <strong>{drone.name}</strong> ({drone.id}) for mission{' '}
          <strong>{mission.id}</strong>.
        </p>

        {/* Steps */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '20px',
            marginBottom: 20,
            boxShadow: 'var(--shadow)',
          }}
        >
          {STEPS.map((step, i) => {
            const done = stepsDone > i
            const active =
              stepsDone === i && phase !== 'idle' && phase !== 'done'
            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  gap: 14,
                  marginBottom: i < STEPS.length - 1 ? 20 : 0,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: done
                        ? 'var(--green-bg)'
                        : active
                          ? 'var(--accent-bg)'
                          : 'var(--surface-2)',
                      border: `1.5px solid ${done ? 'var(--green)' : active ? 'var(--accent)' : 'var(--border-2)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {done ? (
                      <span
                        style={{
                          color: 'var(--green)',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        ✓
                      </span>
                    ) : active ? (
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          border: '2px solid var(--accent)',
                          borderTopColor: 'transparent',
                        }}
                        className="spin"
                      />
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--text-3)',
                        }}
                      >
                        {i + 1}
                      </span>
                    )}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      style={{
                        width: 1,
                        flex: 1,
                        background: done ? 'var(--green)' : 'var(--border)',
                        marginTop: 4,
                        minHeight: 16,
                        opacity: 0.5,
                      }}
                    />
                  )}
                </div>
                <div
                  style={{
                    paddingTop: 4,
                    paddingBottom: i < STEPS.length - 1 ? 16 : 0,
                  }}
                >
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: done
                        ? 'var(--green-text)'
                        : active
                          ? 'var(--accent)'
                          : 'var(--text-2)',
                    }}
                  >
                    {step.label}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-3)',
                      marginTop: 2,
                    }}
                  >
                    {step.detail}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '14px',
              marginBottom: 20,
              maxHeight: 160,
              overflowY: 'auto',
            }}
          >
            {log.map((entry, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  marginBottom: 4,
                  fontSize: 12,
                  fontFamily: 'var(--font-data)',
                }}
              >
                <span style={{ color: 'var(--text-3)', flexShrink: 0 }}>
                  {entry.t}
                </span>
                <span
                  style={{ color: entry.ok ? 'var(--text-2)' : 'var(--red)' }}
                >
                  {entry.msg}
                </span>
              </div>
            ))}
          </div>
        )}

        {phase === 'idle' && (
          <button
            onClick={start}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--accent)',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Connect to drone
          </button>
        )}
        {(phase === 'discover' ||
          phase === 'handshake' ||
          phase === 'sync') && (
          <button
            disabled
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--surface-2)',
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--text-3)',
              cursor: 'not-allowed',
            }}
          >
            Connecting…
          </button>
        )}
        {phase === 'done' && (
          <button
            onClick={onConnected}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 8,
              border: 'none',
              background: 'var(--green)',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Continue to pre-flight check
          </button>
        )}
      </div>
    </div>
  )
}
