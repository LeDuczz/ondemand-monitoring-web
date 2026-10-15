import { useI18n } from '../../../../../shared/i18n'
import type { ControlStatus } from '../inFlightTypes'
import type {
  getLidarSeverityStyle,
  LidarDirection,
  LidarDirectionState,
} from '../lidarHelpers'
import { Icon } from './Icon'
import { lidarAlertBannerMessages } from './LidarAlertBanner.messages'

type SeverityStyle = ReturnType<typeof getLidarSeverityStyle>

export function LidarAlertBanner({
  alertStyle,
  fresh,
  lidar,
  nearestObstacle,
  directionLabel,
}: {
  alertStyle: SeverityStyle
  fresh: boolean
  lidar: ControlStatus['lidar']
  nearestObstacle: LidarDirectionState | undefined
  directionLabel: Record<LidarDirection, string>
}) {
  const { t } = useI18n(lidarAlertBannerMessages)
  return (
    <div style={{ padding: '0 9px 9px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          borderRadius: 10,
          padding: '8px 9px',
          background: alertStyle.badgeBg,
          border: `1px solid ${alertStyle.badgeBorder}`,
        }}
      >
        <span
          style={{
            width: 23,
            height: 23,
            borderRadius: 999,
            display: 'grid',
            placeItems: 'center',
            color: alertStyle.icon,
            background: 'rgba(2,6,23,.26)',
          }}
        >
          {!fresh || !lidar?.available ? (
            <Icon name="minus" size={14} />
          ) : nearestObstacle ? (
            <Icon
              name={nearestObstacle.severity === 'CLEAR' ? 'shield' : 'alert'}
              size={15}
            />
          ) : (
            <Icon name="shield" size={15} />
          )}
        </span>
        <div
          style={{
            display: 'grid',
            gap: 2,
            minWidth: 0,
          }}
        >
          <strong style={{ color: '#f8fafc', fontSize: 10, lineHeight: 1.15 }}>
            {!fresh || !lidar?.available
              ? fresh
                ? t.unavailable
                : t.stale
              : nearestObstacle
                ? t.nearestObstacle(
                    nearestObstacle.display,
                    directionLabel[nearestObstacle.direction],
                  )
                : t.noObstacle}
          </strong>
          <span style={{ color: '#cbd5e1', fontSize: 8, lineHeight: 1.15 }}>
            {nearestObstacle?.severity === 'DANGER'
              ? t.holdPosition
              : nearestObstacle?.severity === 'CAUTION'
                ? t.proceedCaution
                : t.sectorsClear}
          </span>
        </div>
      </div>
    </div>
  )
}
