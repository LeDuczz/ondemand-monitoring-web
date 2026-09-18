import { useState } from 'react'
import type { Mission, Drone } from '../types'

interface Props {
  mission: Mission
  drone: Drone
  onAccept: () => void
  onReject: (reason: string) => void
  onBack: () => void
}

const REJECTION_REASONS = [
  'Equipment not suitable for this mission type',
  'Weather conditions are unsafe',
  'Scheduling conflict with active mission',
  'Mission parameters require specialist certification',
  'Drone requires maintenance before next deployment',
  'Insufficient flight time for mission scope',
  'Other reason',
]

export default function AcceptReject({
  mission,
  drone,
  onAccept,
  onReject,
  onBack,
}: Props) {
  const [mode, setMode] = useState<'review' | 'reject'>('review')
  const [reason, setReason] = useState('')
  const [confirmed, setConfirmed] = useState(false)

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

      <div style={{ maxWidth: 580 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 6px',
          }}
        >
          Mission assignment
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 28px' }}>
          Review the mission requirements and confirm your acceptance or
          rejection.
        </p>

        {/* Mission summary card */}
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
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              color: 'var(--text)',
              marginBottom: 4,
            }}
          >
            {mission.title}
          </div>
          <div
            style={{
              fontSize: 13,
              fontFamily: 'var(--font-data)',
              color: 'var(--text-3)',
              marginBottom: 14,
            }}
          >
            {mission.id}
          </div>
          {[
            { label: 'Customer', value: mission.customer },
            { label: 'Location', value: mission.location },
            {
              label: 'Scheduled',
              value: new Date(mission.scheduledAt).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'short',
              }),
            },
            { label: 'Duration', value: `~${mission.estimatedMinutes} min` },
            { label: 'Drone', value: `${drone.name} (${drone.id})` },
          ].map((r) => (
            <div
              key={r.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '8px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <span style={{ fontSize: 13, color: 'var(--text-2)' }}>
                {r.label}
              </span>
              <span
                style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}
              >
                {r.value}
              </span>
            </div>
          ))}
        </div>

        {mode === 'review' && (
          <>
            <label
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
                cursor: 'pointer',
                marginBottom: 24,
                padding: '14px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
              }}
            >
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <span
                style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}
              >
                I have reviewed the mission requirements and confirm I am ready
                to operate this mission as the assigned drone operator.
              </span>
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setMode('reject')}
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
                Reject mission
              </button>
              <button
                onClick={onAccept}
                disabled={!confirmed}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: confirmed ? 'var(--accent)' : 'var(--surface-2)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: confirmed ? '#fff' : 'var(--text-3)',
                  cursor: confirmed ? 'pointer' : 'not-allowed',
                }}
              >
                Accept mission
              </button>
            </div>
          </>
        )}

        {mode === 'reject' && (
          <>
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
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--text)',
                  marginBottom: 14,
                }}
              >
                Reason for rejection
              </div>
              {REJECTION_REASONS.map((r) => (
                <label
                  key={r}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 0',
                    cursor: 'pointer',
                    borderBottom: '1px solid var(--border)',
                  }}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={reason === r}
                    onChange={() => setReason(r)}
                  />
                  <span style={{ fontSize: 14, color: 'var(--text)' }}>
                    {r}
                  </span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => setMode('review')}
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
                Cancel
              </button>
              <button
                onClick={() => onReject(reason)}
                disabled={!reason}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 8,
                  border: 'none',
                  background: reason ? 'var(--red)' : 'var(--surface-2)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: reason ? '#fff' : 'var(--text-3)',
                  cursor: reason ? 'pointer' : 'not-allowed',
                }}
              >
                Confirm rejection
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
