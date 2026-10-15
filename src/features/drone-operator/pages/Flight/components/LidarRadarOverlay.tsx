import { memo } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import type { ControlStatus } from '../inFlightTypes'
import {
  formatLidarDistance,
  getLidarFresh,
  getLidarSeverity,
  getLidarSeverityStyle,
  getMinValidDistance,
  type LidarDirection,
  type LidarDirectionState,
  type LidarSeverity,
} from '../lidarHelpers'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { GlassPanel } from './GlassPanel'
import { LidarAlertBanner } from './LidarAlertBanner'
import { LidarRadarDial } from './LidarRadarDial'
import { LidarRadarHeader } from './LidarRadarHeader'
import { lidarRadarOverlayMessages } from './LidarRadarOverlay.messages'
import { LidarSectorCards } from './LidarSectorCards'

export const LidarRadarOverlay = memo(function LidarRadarOverlay({
  status,
}: {
  status: ControlStatus | null
}) {
  useRenderDiagnostics('LidarRadarOverlay')
  const { t } = useI18n(lidarRadarOverlayMessages)
  const directionLabel: Record<LidarDirection, string> = {
    FRONT: t.direction.front,
    LEFT: t.direction.left,
    RIGHT: t.direction.right,
    BACK: t.direction.back,
  }
  const severityLabel: Record<LidarSeverity, string> = {
    DANGER: t.status.danger,
    CAUTION: t.status.caution,
    CLEAR: t.status.clear,
    UNKNOWN: t.status.unknown,
  }
  const lidar = status?.lidar
  const fresh = getLidarFresh(lidar)
  const maxRange =
    typeof lidar?.rangeMaxM === 'number' && Number.isFinite(lidar.rangeMaxM)
      ? lidar.rangeMaxM
      : 60
  const rawDirectionStates: Array<
    Omit<LidarDirectionState, 'severity' | 'display'>
  > = [
    {
      direction: 'FRONT',
      value: getMinValidDistance([
        lidar?.frontM,
        lidar?.frontLeftM,
        lidar?.frontRightM,
      ]),
    },
    {
      direction: 'LEFT',
      value: getMinValidDistance([lidar?.leftM]),
    },
    {
      direction: 'RIGHT',
      value: getMinValidDistance([lidar?.rightM]),
    },
    {
      direction: 'BACK',
      value: getMinValidDistance([lidar?.backM]),
    },
  ]
  const directionStates: LidarDirectionState[] = rawDirectionStates.map(
    (item) => {
      const severity = getLidarSeverity(item.value, fresh, maxRange)
      return {
        ...item,
        severity,
        display: formatLidarDistance(item.value, maxRange),
      }
    },
  )
  const orderedSeverities: LidarSeverity[] = [
    'DANGER',
    'CAUTION',
    'UNKNOWN',
    'CLEAR',
  ]
  const panelSeverity = fresh
    ? (orderedSeverities.find((severity) =>
        directionStates.some((item) => item.severity === severity),
      ) ?? 'UNKNOWN')
    : 'UNKNOWN'
  const statusLabel = fresh
    ? panelSeverity === 'DANGER'
      ? t.status.danger
      : panelSeverity === 'CAUTION'
        ? t.status.caution
        : panelSeverity === 'CLEAR'
          ? t.status.active
          : t.status.unknown
    : t.status.stale
  const nearestObstacle = directionStates
    .filter(
      (item) =>
        item.value !== null &&
        item.severity !== 'UNKNOWN' &&
        item.value < maxRange * 0.995,
    )
    .sort((a, b) => Number(a.value) - Number(b.value))[0]
  const alertStyle = getLidarSeverityStyle(
    !fresh ? 'UNKNOWN' : (nearestObstacle?.severity ?? 'CLEAR'),
  )
  const panelBorder = getLidarSeverityStyle(panelSeverity)

  return (
    <GlassPanel
      style={{
        width: '100%',
        minWidth: 0,
        alignSelf: 'start',
        padding: 0,
        overflow: 'hidden',
        border: `1px solid ${panelBorder.badgeBorder}`,
        background:
          'linear-gradient(180deg, rgba(8,18,33,.9), rgba(8,13,24,.78))',
      }}
    >
      <LidarRadarHeader
        panelBorder={panelBorder}
        statusLabel={statusLabel}
        maxRange={maxRange}
      />
      <LidarRadarDial
        directionStates={directionStates}
        directionLabel={directionLabel}
        severityLabel={severityLabel}
      />
      <LidarSectorCards
        directionStates={directionStates}
        directionLabel={directionLabel}
        severityLabel={severityLabel}
      />
      <LidarAlertBanner
        alertStyle={alertStyle}
        fresh={fresh}
        lidar={lidar}
        nearestObstacle={nearestObstacle}
        directionLabel={directionLabel}
      />
    </GlassPanel>
  )
})
