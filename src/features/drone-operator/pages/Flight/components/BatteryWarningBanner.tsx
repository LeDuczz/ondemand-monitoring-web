import { useI18n } from '../../../../../shared/i18n'
import type { ControlStatus } from '../inFlightTypes'
import { batteryWarningBannerMessages } from './BatteryWarningBanner.messages'
import { GlassPanel } from './GlassPanel'
import { Icon } from './Icon'

export function BatteryWarningBanner({
  batteryState,
  batteryDisplay,
  geofenceAlertActive,
}: {
  batteryState: NonNullable<ControlStatus['batteryState']>
  batteryDisplay: string
  geofenceAlertActive: boolean
}) {
  const { t } = useI18n(batteryWarningBannerMessages)
  return (
    <GlassPanel
      style={{
        position: 'absolute',
        left: '50%',
        top: geofenceAlertActive ? 92 : 20,
        transform: 'translateX(-50%)',
        width: 'min(360px, calc(100% - 56px))',
        padding: '11px 14px',
        border: `1px solid ${batteryState === 'LOW' ? 'rgba(251,191,36,.7)' : 'rgba(248,113,113,.72)'}`,
        background:
          batteryState === 'LOW'
            ? 'rgba(120,53,15,.82)'
            : 'rgba(127,29,29,.78)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Icon name="alert" size={20} />
        <div>
          <div
            style={{
              fontSize: 12,
              fontWeight: 950,
              color: batteryState === 'LOW' ? '#fef3c7' : '#fee2e2',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
            }}
          >
            {batteryState === 'LOW'
              ? t.low
              : batteryState === 'CRITICAL'
                ? t.critical
                : t.emergency}{' '}
            - {batteryDisplay}
          </div>
          <div
            style={{
              marginTop: 3,
              fontSize: 11,
              color: batteryState === 'LOW' ? '#fde68a' : '#fecaca',
              fontWeight: 750,
            }}
          >
            {t.note}
          </div>
        </div>
      </div>
    </GlassPanel>
  )
}
