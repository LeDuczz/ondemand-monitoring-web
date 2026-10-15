import { useI18n } from '../../../../../shared/i18n'
import type { RuntimeCheck, RuntimeStatus } from '../types'
import { precheckCheckRowMessages } from './PrecheckCheckRow.messages'

type RowLabels = typeof precheckCheckRowMessages.vi

function checkLabel(status: RuntimeStatus, t: RowLabels) {
  if (status === 'PASS') return t.pass
  if (status === 'WARN') return t.warn
  if (status === 'FAIL') return t.fail
  if (status === 'CHECKING') return t.checking
  return t.pending
}

function preflightCheckName(item: RuntimeCheck, t: RowLabels) {
  return t.nameLabels[item.key] ?? t.nameFallbacks[item.name] ?? item.name
}

function preflightMessageLabel(message: string, t: RowLabels) {
  const text = message.trim()
  if (!text) return ''

  const lower = text.toLowerCase()
  if (lower.includes('required components')) return t.requiredComponents
  if (lower.includes('fresh scan received')) return t.freshScan
  if (lower.includes('ready for takeoff')) return t.readyForTakeoff
  if (lower.includes('camera frames received')) return t.cameraFrames
  if (lower.includes('sufficient for operation'))
    return text.replace('sufficient for operation', t.sufficientForOperation)
  if (lower.includes('ready to fly')) return t.readyToFly
  if (lower.includes('px4 health ready')) return t.px4HealthReady
  if (lower.includes('drone model loaded')) return t.droneModelLoaded
  if (lower.includes('media capture pipeline ready'))
    return t.mediaPipelineReady
  if (lower.includes('px4 discovered')) return t.px4Discovered
  if (lower.includes('flight controller')) return t.flightControllerReady
  if (lower.includes('heartbeat not available')) return t.noHeartbeat
  if (lower.includes('too low for safe mission start'))
    return text.replace('too low for safe mission start', t.tooLowForSafeStart)
  if (lower === 'pending') return t.waiting
  if (lower.includes('waiting for flight controller api'))
    return t.waitingForApi

  return text
}

export function PrecheckCheckRow({
  item,
  isLast,
}: {
  item: RuntimeCheck
  isLast: boolean
}) {
  const { t } = useI18n(precheckCheckRowMessages)
  const message = preflightMessageLabel(item.message, t)

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '18px 1fr auto',
        gap: 6,
        alignItems: 'center',
        padding: '7px 10px',
        borderBottom: !isLast ? '1px solid var(--bd)' : 'none',
        background: item.status === 'FAIL' ? 'var(--red-bg)' : '#fff',
        fontSize: 12,
      }}
    >
      <span
        style={{
          fontWeight: 800,
          color: item.status === 'FAIL' ? 'var(--red-fg)' : 'var(--green-fg)',
          fontSize: 13,
        }}
      >
        {item.status === 'FAIL'
          ? '✗'
          : item.status === 'PASS' || item.status === 'WARN'
            ? '✓'
            : '○'}
      </span>
      <div>
        <div
          style={{
            fontWeight: 600,
            color: item.status === 'FAIL' ? 'var(--red-fg)' : 'var(--tx)',
          }}
        >
          {preflightCheckName(item, t)}
        </div>
        {message && (
          <div
            style={{
              fontSize: 11,
              color: item.status === 'FAIL' ? 'var(--red-fg)' : 'var(--tx3)',
              marginTop: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 140,
            }}
            title={message}
          >
            {message}
          </div>
        )}
      </div>
      <span
        style={{
          fontWeight: 700,
          fontSize: 11.5,
          color: item.status === 'FAIL' ? 'var(--red-fg)' : 'var(--green-fg)',
          whiteSpace: 'nowrap',
        }}
      >
        {checkLabel(item.status, t)}
      </span>
    </div>
  )
}
