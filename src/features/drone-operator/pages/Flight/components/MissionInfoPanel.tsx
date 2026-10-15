import { memo } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import type { Mission } from '../../../types/omss'
import type { ControlStatus } from '../inFlightTypes'
import { useRenderDiagnostics } from '../useRenderDiagnostics'
import { FlightPlanGuide } from './FlightPlanGuide'
import { GlassPanel } from './GlassPanel'
import { missionInfoPanelMessages } from './MissionInfoPanel.messages'

export const MissionInfoPanel = memo(function MissionInfoPanel({
  status,
  progress,
  mission,
}: {
  status: ControlStatus | null
  progress: number
  mission: Mission
}) {
  useRenderDiagnostics('MissionInfo')
  const { t } = useI18n(missionInfoPanelMessages)
  const yaw =
    typeof status?.yawDeg === 'number' && Number.isFinite(status.yawDeg)
      ? `${Math.round(status.yawDeg)}°`
      : '--'
  const distance =
    typeof mission.distanceKm === 'number' &&
    Number.isFinite(mission.distanceKm)
      ? `${mission.distanceKm.toFixed(1)} km`
      : '--'
  const routePointCount = mission.routePoints?.length ?? 0
  const routePoints = (mission.routePoints ?? [])
    .slice()
    .sort((a, b) => a.sequence - b.sequence)

  return (
    <GlassPanel
      style={{
        width: '100%',
        height: 'auto',
        minHeight: 'fit-content',
        flexShrink: 0,
        overflow: 'hidden',
        padding: 10,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 950,
          color: '#cbd5e1',
          marginBottom: 8,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
        }}
      >
        {t.title}
      </div>
      {(
        [
          {
            id: 'mission',
            label: t.mission,
            value: mission.id,
            mono: false,
          },
          {
            id: 'order',
            label: t.order,
            value: mission.orderRef,
            mono: false,
          },
          {
            id: 'progress',
            label: t.progress,
            value: `${progress.toFixed(1)}%`,
            mono: true,
          },
          {
            id: 'distance',
            label: t.distance,
            value: distance,
            mono: true,
          },
          {
            id: 'points',
            label: t.points,
            value: routePointCount > 0 ? `${routePointCount}` : '--',
            mono: false,
          },
          {
            id: 'maxAlt',
            label: t.maxAlt,
            value: `${mission.maxAltitudeM.toFixed(0)} m`,
            mono: false,
          },
          {
            id: 'heading',
            label: t.heading,
            value: yaw,
            mono: true,
          },
          {
            id: 'auto',
            label: t.auto,
            value: status?.autoPlan?.active
              ? t.waypointCount(
                  status.autoPlan.currentIndex ?? 0,
                  status.autoPlan.total ?? routePointCount,
                )
              : (status?.autoPlan?.status ?? t.manual),
            mono: false,
          },
        ] as const
      ).map(({ id, label, value, mono }) => (
        <div
          key={id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 4,
          }}
        >
          <span style={{ color: '#94a3b8', fontSize: 11 }}>{label}</span>
          <strong
            style={{
              minWidth: 0,
              color: '#e5edf8',
              fontSize: 12,
              fontFamily: mono ? 'var(--font-data)' : 'var(--font-ui)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'right',
            }}
          >
            {value}
          </strong>
        </div>
      ))}
      <FlightPlanGuide routePoints={routePoints} />
    </GlassPanel>
  )
})
