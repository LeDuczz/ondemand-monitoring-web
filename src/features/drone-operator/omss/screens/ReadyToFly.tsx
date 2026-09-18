import { useState, useEffect } from 'react'
import type { Mission, Drone, FlightToken } from '../types'

interface Props {
  mission: Mission
  drone: Drone
  token: FlightToken
  onStart: () => void
  onAbort: () => void
}

export default function ReadyToFly({
  mission,
  drone,
  token,
  onStart,
  onAbort,
}: Props) {
  const [remaining, setRemaining] = useState(
    Math.max(0, Math.round((token.expiresAt - Date.now()) / 1000)),
  )
  const [confirmed, setConfirmed] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const tokenValid = remaining > 0
  const urgent = remaining < 120
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0')
  const ss = String(remaining % 60).padStart(2, '0')
  const canStart = tokenValid && confirmed

  const CHECKS = [
    { label: 'Mission accepted', ok: true },
    { label: 'Drone connected', ok: true },
    { label: 'Pre-flight passed', ok: true },
    { label: 'Handover completed', ok: true },
    { label: 'Flight token valid', ok: tokenValid },
  ]

  return (
    <div
      className="fade-in"
      style={{ flex: 1, overflowY: 'auto', padding: '32px 36px' }}
    >
      <div style={{ maxWidth: 520 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 6px',
          }}
        >
          Ready to fly
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 28px' }}>
          All pre-flight requirements have been met. Review and start the
          mission.
        </p>

        {/* Readiness card */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--green-border)',
            borderRadius: 10,
            padding: '22px',
            marginBottom: 20,
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: 'var(--green)',
              }}
              className="pulse-dot"
            />
            <span
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--green-text)',
              }}
            >
              Ready to fly
            </span>
          </div>
          {CHECKS.map((c) => (
            <div
              key={c.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span
                style={{
                  fontSize: 15,
                  color: c.ok ? 'var(--green)' : 'var(--red)',
                }}
              >
                {c.ok ? '✓' : '✕'}
              </span>
              <span
                style={{
                  fontSize: 14,
                  color: c.ok ? 'var(--text)' : 'var(--red-text)',
                  fontWeight: c.ok ? 400 : 500,
                }}
              >
                {c.label}
              </span>
            </div>
          ))}

          {/* Token */}
          <div
            style={{
              marginTop: 18,
              padding: '14px',
              background: urgent ? 'var(--red-bg)' : 'var(--surface-2)',
              borderRadius: 8,
              border: `1px solid ${urgent ? 'var(--red-border)' : 'var(--border)'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-3)',
                  marginBottom: 3,
                }}
              >
                Flight token
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-data)',
                  color: 'var(--text-3)',
                }}
              >
                {token.token}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 24,
                  fontFamily: 'var(--font-data)',
                  fontWeight: 700,
                  color: urgent ? 'var(--red)' : 'var(--text)',
                  lineHeight: 1,
                }}
              >
                {mm}:{ss}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: urgent ? 'var(--red-text)' : 'var(--text-3)',
                  marginTop: 2,
                }}
              >
                remaining
              </div>
            </div>
          </div>
        </div>

        {/* Mission summary */}
        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '16px 20px',
            marginBottom: 20,
            boxShadow: 'var(--shadow)',
          }}
        >
          {[
            ['Mission', mission.id],
            ['Drone', `${drone.name} (${drone.id})`],
            ['Location', mission.location],
            ['Battery', `${drone.battery}%`],
          ].map(([l, v]) => (
            <div
              key={l}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>{l}</span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text)',
                  fontFamily:
                    l === 'Mission' || l === 'Drone'
                      ? 'var(--font-data)'
                      : undefined,
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>

        {!tokenValid && (
          <div
            style={{
              background: 'var(--red-bg)',
              border: '1px solid var(--red-border)',
              borderRadius: 8,
              padding: '12px 16px',
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--red-text)',
              }}
            >
              Flight token expired
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--red-text)',
                opacity: 0.8,
                marginTop: 3,
              }}
            >
              Return to control handover to issue a new token before starting.
            </div>
          </div>
        )}

        <label
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            cursor: 'pointer',
            marginBottom: 16,
            padding: '12px',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 8,
          }}
        >
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            disabled={!tokenValid}
          />
          <span style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>
            I confirm all pre-flight requirements are met and I am ready to
            begin the mission.
          </span>
        </label>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={onAbort}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid var(--border-2)',
              background: 'var(--surface)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-2)',
              cursor: 'pointer',
            }}
          >
            Abort
          </button>
          <button
            onClick={onStart}
            disabled={!canStart}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: 8,
              border: 'none',
              background: canStart ? 'var(--accent)' : 'var(--surface-2)',
              fontSize: 14,
              fontWeight: 700,
              color: canStart ? '#fff' : 'var(--text-3)',
              cursor: canStart ? 'pointer' : 'not-allowed',
            }}
          >
            Start mission
          </button>
        </div>
      </div>
    </div>
  )
}
