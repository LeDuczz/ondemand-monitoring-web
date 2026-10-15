import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import type { ConnectState } from '../types'
import { connectionStatusCardMessages } from './ConnectionStatusCard.messages'

export function ConnectionStatusCard({
  state,
  error,
}: {
  state: ConnectState
  error: string | null
}) {
  const { t } = useI18n(connectionStatusCardMessages)
  const TRACKER_STEPS = t.trackerSteps
  const doneCount =
    state === 'connected'
      ? 3
      : state === 'connecting'
        ? 1
        : state === 'failed'
          ? 1
          : 0
  const activeIndex = state === 'connecting' ? 1 : -1
  const failedIndex = state === 'failed' ? 1 : -1

  const badgeTone =
    state === 'connected'
      ? 'green'
      : state === 'connecting'
        ? 'blue'
        : state === 'failed'
          ? 'red'
          : 'gray'
  const badgeLabel =
    state === 'connected'
      ? t.badge.connected
      : state === 'connecting'
        ? t.badge.connecting
        : state === 'failed'
          ? t.badge.failed
          : t.badge.default

  return (
    <div className="odm-card">
      <div className="odm-card-body" style={{ padding: '16px 18px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 14 }}>
            {t.connectionStatus}
          </span>
          <StatusBadge tone={badgeTone}>{badgeLabel}</StatusBadge>
        </div>
        <div style={{ marginTop: 6 }}>
          {TRACKER_STEPS.map((label, i) => {
            const done = i < doneCount
            const active = i === activeIndex
            const failedHere = i === failedIndex
            return (
              <div
                key={label}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'flex-start',
                  padding: '7px 0',
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                    background: failedHere
                      ? 'var(--red-solid)'
                      : done
                        ? 'var(--green-solid)'
                        : active
                          ? 'var(--blue-solid)'
                          : 'var(--gray-bg)',
                    color: failedHere
                      ? 'var(--red-on)'
                      : done
                        ? 'var(--green-on)'
                        : active
                          ? 'var(--blue-on)'
                          : 'var(--gray-fg)',
                  }}
                >
                  {failedHere ? '✕' : done ? '✓' : active ? '…' : '○'}
                </span>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 13.5,
                    color:
                      done || failedHere || active ? undefined : 'var(--tx3)',
                  }}
                >
                  {label}
                </div>
              </div>
            )
          })}
        </div>
        {state === 'failed' && error ? (
          <div
            style={{
              marginTop: 8,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--red-bg)',
              color: 'var(--red-fg)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 600 }}>
              disconnect_reason
            </div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{error}</div>
          </div>
        ) : null}
        {state === 'connected' ? (
          <div
            style={{
              marginTop: 8,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'var(--green-bg)',
              color: 'var(--green-fg)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 700,
                fontSize: 12.5,
              }}
            >
              <span>{t.heartbeatTelemetry}</span>
              <span className="odm-mono">10 Hz</span>
            </div>
            <div style={{ fontSize: 12, marginTop: 4 }}>
              {t.telemetrySummary(18)}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}
