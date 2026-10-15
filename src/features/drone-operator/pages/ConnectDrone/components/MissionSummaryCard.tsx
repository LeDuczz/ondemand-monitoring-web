import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import type { BackendMission } from '../../../api/liveMission'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import { missionSummaryCardMessages } from './MissionSummaryCard.messages'

export function MissionSummaryCard({ mission }: { mission?: BackendMission }) {
  const { t, locale } = useI18n(missionSummaryCardMessages)
  const deviceLabel = mission ? formatDeviceLabel(mission) : null

  return (
    <div className="odm-card">
      <div
        className="odm-card-body"
        style={{
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span className="odm-mono" style={{ fontWeight: 700, fontSize: 13 }}>
            {mission?.missionCode ?? mission?.id ?? t.noMissionSelected}
          </span>
          <StatusBadge tone="green">{t.received}</StatusBadge>
        </div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>
          {mission?.orderTitle ?? t.missionBeingAssigned}
        </div>
        <div
          style={{
            color: 'var(--tx2)',
            fontSize: 12.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 3,
          }}
        >
          <span>
            {mission?.scheduledStartAt
              ? new Date(mission.scheduledStartAt).toLocaleString(locale)
              : t.noSchedule}
          </span>
          <span>{deviceLabel ?? t.noDroneAssigned}</span>
          <span>{mission?.address ?? t.noAddress}</span>
        </div>
      </div>
    </div>
  )
}
