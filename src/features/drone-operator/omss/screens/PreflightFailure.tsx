import type { CheckItem, ChecklistScenario } from '../types'

interface Props {
  checklist: CheckItem[]
  scenario: ChecklistScenario
  onReplace: () => void
  onBack: () => void
  onEscalate: () => void
}

const SCENARIO_CFG: Record<
  ChecklistScenario,
  { title: string; desc: string; canReplace: boolean; canAcknowledge: boolean }
> = {
  'all-pass': {
    title: 'No failures detected',
    desc: 'All checks passed.',
    canReplace: false,
    canAcknowledge: false,
  },
  'battery-fail': {
    title: 'Battery charge insufficient',
    desc: 'Battery level is below the minimum 80% threshold. The drone must be charged before deployment.',
    canReplace: true,
    canAcknowledge: false,
  },
  'hardware-fail': {
    title: 'Hardware fault detected',
    desc: 'Camera or gimbal is reporting a fault. The drone requires maintenance before it can be deployed.',
    canReplace: true,
    canAcknowledge: false,
  },
  'telemetry-stale': {
    title: 'Telemetry link degraded',
    desc: 'Telemetry signal is older than 5 seconds. This indicates a communication issue, not a physical fault — verify the ground station antenna and signal path.',
    canReplace: false,
    canAcknowledge: true,
  },
  'weather-warn': {
    title: 'Weather advisory',
    desc: 'Conditions are marginal but within acceptable limits. Review the advisory and proceed with caution or postpone.',
    canReplace: false,
    canAcknowledge: true,
  },
}

export default function PreflightFailure({
  checklist,
  scenario,
  onReplace,
  onBack,
  onEscalate,
}: Props) {
  const cfg = SCENARIO_CFG[scenario]
  const failed = checklist.filter((c) => c.status === 'FAIL')
  const warned = checklist.filter((c) => c.status === 'WARNING')

  const isHardware = scenario === 'hardware-fail' || scenario === 'battery-fail'

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
        Pre-flight check
      </button>

      <div style={{ maxWidth: 580 }}>
        {/* Alert header */}
        <div
          style={{
            background: isHardware ? 'var(--red-bg)' : 'var(--amber-bg)',
            border: `1px solid ${isHardware ? 'var(--red-border)' : 'var(--amber-border)'}`,
            borderRadius: 10,
            padding: '20px',
            marginBottom: 24,
          }}
        >
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: isHardware ? 'var(--red)' : 'var(--amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 18 18"
                fill="none"
                stroke="#fff"
                strokeWidth="1.8"
              >
                {isHardware ? (
                  <>
                    <line x1="5" y1="5" x2="13" y2="13" />
                    <line x1="13" y1="5" x2="5" y2="13" />
                  </>
                ) : (
                  <>
                    <line x1="9" y1="5" x2="9" y2="11" />
                    <circle cx="9" cy="13.5" r=".8" fill="#fff" stroke="none" />
                  </>
                )}
              </svg>
            </div>
            <div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: isHardware ? 'var(--red-text)' : 'var(--amber-text)',
                  marginBottom: 6,
                }}
              >
                {cfg.title}
              </div>
              <div
                style={{
                  fontSize: 14,
                  color: isHardware ? 'var(--red-text)' : 'var(--amber-text)',
                  opacity: 0.85,
                  lineHeight: 1.6,
                }}
              >
                {cfg.desc}
              </div>
            </div>
          </div>
        </div>

        {/* Telemetry stale callout */}
        {scenario === 'telemetry-stale' && (
          <div
            style={{
              background: 'var(--blue-bg)',
              border: '1px solid var(--blue-border)',
              borderRadius: 8,
              padding: '14px 16px',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--blue-text)',
                marginBottom: 4,
              }}
            >
              Communication issue — not a hardware fault
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--blue-text)',
                opacity: 0.85,
                lineHeight: 1.6,
              }}
            >
              Stale telemetry means the ground station is not receiving fresh
              data from the drone. The drone itself may be operational. Check
              antenna connections and signal path before replacing the drone.
            </div>
          </div>
        )}

        {/* Failed/warning items */}
        {(failed.length > 0 || warned.length > 0) && (
          <div
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: 'var(--shadow)',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                padding: '12px 20px',
                borderBottom: '1px solid var(--border)',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--text)',
              }}
            >
              Check results
            </div>
            {[...failed, ...warned].map((item, i) => (
              <div
                key={item.id}
                style={{
                  padding: '14px 20px',
                  borderBottom:
                    i < failed.length + warned.length - 1
                      ? '1px solid var(--border)'
                      : 'none',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 500,
                        color: 'var(--text)',
                        marginBottom: 3,
                      }}
                    >
                      {item.label}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      {item.value}
                    </div>
                    {item.explanation && (
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-3)',
                          marginTop: 4,
                        }}
                      >
                        {item.explanation}
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      padding: '3px 10px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background:
                        item.status === 'FAIL'
                          ? 'var(--red-bg)'
                          : 'var(--amber-bg)',
                      color:
                        item.status === 'FAIL'
                          ? 'var(--red-text)'
                          : 'var(--amber-text)',
                      border: `1px solid ${item.status === 'FAIL' ? 'var(--red-border)' : 'var(--amber-border)'}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {item.status === 'FAIL' ? '✕ Failed' : '⚠ Warning'}
                  </span>
                </div>
                {item.action && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      background: 'var(--surface-2)',
                      borderRadius: 6,
                      fontSize: 12,
                      color: 'var(--text-2)',
                    }}
                  >
                    <strong>Action:</strong> {item.action}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, flexDirection: 'column' }}>
          {cfg.canReplace && (
            <button
              onClick={onReplace}
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
              Select replacement drone
            </button>
          )}
          {cfg.canAcknowledge && (
            <button
              onClick={onBack}
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
              Acknowledge and continue
            </button>
          )}
          <button
            onClick={onEscalate}
            style={{
              width: '100%',
              padding: '11px',
              borderRadius: 8,
              border: '1px solid var(--border-2)',
              background: 'var(--surface)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text-2)',
              cursor: 'pointer',
            }}
          >
            Escalate to manager
          </button>
        </div>
      </div>
    </div>
  )
}
