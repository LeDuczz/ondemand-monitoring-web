import { useI18n } from '../../../../../shared/i18n'
import type { PostflightCheckStatus } from '../types'
import { postcheckBasicChecksMessages } from './PostcheckBasicChecks.messages'

export function PostcheckBasicChecks({
  postflight,
}: {
  postflight: PostflightCheckStatus
}) {
  const { t } = useI18n(postcheckBasicChecksMessages)
  const checks: Array<[string, boolean | null | undefined]> = [
    [t.airframe, postflight.physicalConditionOk],
    [t.motor, postflight.motorOk],
    [t.battery, postflight.batteryOk],
    [t.camera, postflight.cameraOk],
    [t.gps, postflight.gpsOk],
    [t.connection, postflight.communicationOk],
  ]

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 5,
      }}
    >
      {checks.map(([label, value]) => (
        <div
          key={String(label)}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 4,
            padding: '6px 8px',
            borderRadius: 7,
            border: '1px solid var(--bd)',
            background: value === false ? 'var(--red-bg)' : 'var(--sf2)',
            fontSize: 11.5,
          }}
        >
          <span style={{ color: 'var(--tx3)' }}>{label}</span>
          <span
            style={{
              fontWeight: 700,
              color: value === false ? 'var(--red-fg)' : 'var(--green-fg)',
            }}
          >
            {value === true ? '✓' : value === false ? '✗' : '—'}
          </span>
        </div>
      ))}
    </div>
  )
}
