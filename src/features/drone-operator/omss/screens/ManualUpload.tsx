import { useState } from 'react'

interface Props {
  missionId: string
  onComplete: () => void
  onBack: () => void
}

export default function ManualUpload({ missionId, onComplete, onBack }: Props) {
  const [ref, setRef] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [done, setDone] = useState(false)

  if (done)
    return (
      <div
        className="fade-in"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 28,
        }}
      >
        <div style={{ maxWidth: 480, textAlign: 'center' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <polyline
                points="4,13 10,19 22,7"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--text)',
              marginBottom: 8,
            }}
          >
            Manual upload confirmed
          </div>
          <div
            style={{ fontSize: 14, color: 'var(--text-2)', marginBottom: 24 }}
          >
            Reference:{' '}
            <span
              style={{ fontFamily: 'var(--font-data)', color: 'var(--text)' }}
            >
              {ref || 'USB-MANUAL'}
            </span>
            . Mission record is now complete.
          </div>
          <button
            onClick={onComplete}
            style={{
              padding: '11px 28px',
              borderRadius: 8,
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Return to missions
          </button>
        </div>
      </div>
    )

  const steps = [
    {
      n: 1,
      label: 'Remove SD card',
      detail: 'Power down drone first. Eject the SD card from the payload bay.',
    },
    {
      n: 2,
      label: 'Connect via USB card reader',
      detail:
        'Use the USB 3.0 card reader provided. Connect to any USB-A port on the base station.',
    },
    {
      n: 3,
      label: 'Copy media to archive',
      detail: `/mnt/missions/archive/${missionId}/media/ — copy all JPG, MP4, and BIN files.`,
    },
    {
      n: 4,
      label: 'Verify checksums',
      detail: 'Run: ./verify_media.sh and confirm 0 errors in the output.',
    },
    {
      n: 5,
      label: 'Return SD card to drone',
      detail:
        'Safely eject the card reader, re-insert the SD card, and close the payload bay.',
    },
  ]

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
        Back to auto upload
      </button>

      <div style={{ maxWidth: 520 }}>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 6px',
          }}
        >
          Manual USB upload
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-2)', margin: '0 0 28px' }}>
          Automatic upload is unavailable. Follow the steps below to transfer
          media via USB.
        </p>

        <div
          style={{
            background: 'var(--amber-bg)',
            border: '1px solid var(--amber-border)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            fontSize: 14,
            color: 'var(--amber-text)',
          }}
        >
          <strong>Safety:</strong> Ensure the drone is powered down and secured
          before removing storage media.
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            overflow: 'hidden',
            marginBottom: 20,
            boxShadow: 'var(--shadow)',
          }}
        >
          <div
            style={{
              padding: '12px 20px',
              borderBottom: '1px solid var(--border)',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text)',
              background: 'var(--surface-2)',
            }}
          >
            Transfer procedure
          </div>
          {steps.map((s, i) => (
            <div
              key={s.n}
              style={{
                display: 'flex',
                gap: 14,
                padding: '14px 20px',
                borderBottom:
                  i < steps.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: '50%',
                  background: 'var(--accent-bg)',
                  border: '1.5px solid var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--accent)',
                  marginTop: 1,
                }}
              >
                {s.n}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 500,
                    color: 'var(--text)',
                    marginBottom: 3,
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-2)',
                    lineHeight: 1.5,
                    fontFamily: s.n === 3 ? 'var(--font-data)' : undefined,
                  }}
                >
                  {s.detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '16px',
            marginBottom: 16,
            boxShadow: 'var(--shadow)',
          }}
        >
          <label
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text)',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Transfer reference number
          </label>
          <input
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="e.g. USB-2026-09-09-001"
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: 14,
              fontFamily: 'var(--font-data)',
            }}
          />
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
            Enter the reference from the verification script output, or any
            unique identifier.
          </div>
        </div>

        <label
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
            cursor: 'pointer',
            marginBottom: 20,
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
          <span style={{ fontSize: 14, color: 'var(--text)', lineHeight: 1.6 }}>
            I confirm all mission media has been transferred and verified. The
            SD card has been re-inserted and secured.
          </span>
        </label>

        <button
          onClick={() => setDone(true)}
          disabled={!confirmed}
          style={{
            width: '100%',
            padding: '11px',
            borderRadius: 8,
            border: 'none',
            background: confirmed ? 'var(--accent)' : 'var(--surface-2)',
            fontSize: 14,
            fontWeight: 600,
            color: confirmed ? '#fff' : 'var(--text-3)',
            cursor: confirmed ? 'pointer' : 'not-allowed',
          }}
        >
          Confirm manual transfer complete
        </button>
      </div>
    </div>
  )
}
