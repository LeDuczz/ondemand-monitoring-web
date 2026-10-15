import { Fragment, memo } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import type { ControlStatus } from '../inFlightTypes'
import { getLidarFresh, getLidarMetric } from '../lidarHelpers'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { GlassPanel } from './GlassPanel'
import { Icon } from './Icon'
import { lidarDetailPanelMessages } from './LidarDetailPanel.messages'

export const LidarDetailPanel = memo(function LidarDetailPanel({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('LidarDetailPanel')
  const { t } = useI18n(lidarDetailPanelMessages)
  const lidar = status?.lidar
  const fresh = getLidarFresh(lidar)
  const rows = [
    [t.rows.status, fresh ? (lidar?.status ?? t.statusClear) : t.statusWaiting],
    [
      t.rows.action,
      lidar?.status === 'OBSTACLE' ? t.actionAvoid : t.actionContinue,
    ],
    [t.rows.front, getLidarMetric(lidar?.frontM)],
    [t.rows.frontLeft, getLidarMetric(lidar?.frontLeftM)],
    [t.rows.frontRight, getLidarMetric(lidar?.frontRightM)],
    [t.rows.left, getLidarMetric(lidar?.leftM)],
    [t.rows.right, getLidarMetric(lidar?.rightM)],
    [t.rows.back, getLidarMetric(lidar?.backM)],
    [t.rows.nearest, getLidarMetric(lidar?.nearestM)],
    [t.rows.direction, lidar?.nearestDirection ?? lidar?.direction ?? '--'],
    [t.rows.range, getLidarMetric(lidar?.rangeMaxM)],
    [
      t.rows.scanAge,
      lidar?.scanAgeS != null ? `${lidar.scanAgeS.toFixed(1)}s` : '--',
    ],
  ]

  return (
    <GlassPanel
      style={{
        width: '100%',
        padding: 12,
        border: fresh
          ? '1px solid rgba(34,211,238,.28)'
          : '1px solid rgba(251,191,36,.35)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 10,
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            color: fresh ? '#67e8f9' : '#fbbf24',
            fontSize: 12,
            fontWeight: 950,
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          <Icon name="radar" size={14} />
          {t.title}
        </span>
        <strong style={{ color: fresh ? '#bbf7d0' : '#fde68a', fontSize: 10 }}>
          {lidar?.enabled ? t.on : t.off}
        </strong>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 7 }}>
        {rows.map(([label, value]) => (
          <Fragment key={label}>
            <span style={{ color: '#94a3b8', fontSize: 11 }}>{label}</span>
            <strong
              style={{
                color: '#e5edf8',
                fontSize: 11,
                fontFamily: 'var(--font-data)',
                textAlign: 'right',
              }}
            >
              {value}
            </strong>
          </Fragment>
        ))}
      </div>
    </GlassPanel>
  )
})
