import { useI18n } from '../../../../../shared/i18n'
import type { OperatorMission } from '../../../types/mission'
import { useMissionDateFormatter } from '../missionDate'
import { dash, formatCoord } from '../missionFormat'
import { InfoRow } from './InfoRow'
import { missionInfoCardMessages } from './MissionInfoCard.messages'
import { MissionStatusBadge, missionStatusLabel } from './MissionStatusBadge'
import { missionStatusBadgeMessages } from './MissionStatusBadge.messages'

export type InfoCardLabels = typeof missionInfoCardMessages.vi

function missionDescriptionText(
  description: string | undefined,
  t: InfoCardLabels,
): string {
  const text = description?.trim() ?? ''
  const lower = text.toLowerCase()
  if (
    !text ||
    text.length < 2 ||
    lower === 'n/a' ||
    lower === 'na' ||
    lower === 'none'
  ) {
    return t.noDescription
  }
  return text
}

export function locationLabel(value: string, t: InfoCardLabels): string {
  if (value === 'Construction Site') return t.locationConstructionSite
  if (value === 'Dam') return t.locationDam
  if (value === 'Warehouse') return t.locationWarehouse
  return value || t.noLocation
}

export function MissionInfoCard({ mission }: { mission: OperatorMission }) {
  const { t } = useI18n(missionInfoCardMessages)
  const { t: statusT } = useI18n(missionStatusBadgeMessages)
  const formatDate = useMissionDateFormatter()

  return (
    <div className="odm-card">
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>{t.title}</span>
        <MissionStatusBadge mission={mission} />
      </div>
      <div className="odm-card-body" style={{ padding: '10px 14px' }}>
        <InfoRow
          icon="#"
          label={t.missionCode}
          value={mission.missionCode ?? mission.id}
        />
        <InfoRow
          icon="•"
          label={t.systemStatus}
          value={missionStatusLabel(
            mission.backendStatus ?? mission.status,
            statusT,
          )}
        />
        <InfoRow
          icon="📅"
          label={t.flightDate}
          value={formatDate(mission.date)}
        />
        <InfoRow
          icon="⏱"
          label={t.startTime}
          value={mission.startTime || t.notScheduled}
        />
        <InfoRow
          icon="⏳"
          label={t.endTime}
          value={mission.endTime || t.notScheduled}
        />
        <InfoRow
          icon="📍"
          label={t.location}
          value={locationLabel(mission.location, t)}
        />
        <InfoRow
          icon="🔵"
          label={t.monitoringZone}
          value={`${t.radius} ${mission.radiusMeters == null ? '—' : `${mission.radiusMeters} m`}`}
        />
        <InfoRow
          icon="◎"
          label={t.gpsCoords}
          value={`${formatCoord(mission.latitude)}, ${formatCoord(mission.longitude)}`}
        />
        <InfoRow
          icon="X"
          label={t.simCoords}
          value={`X ${dash(mission.targetX)} · Y ${dash(mission.targetY)}`}
        />
        <InfoRow icon="📋" label={t.missionType} value={mission.serviceLabel} />

        {/* Description */}
        <div
          style={{
            borderTop: '1px solid var(--bd)',
            paddingTop: 10,
            marginTop: 6,
          }}
        >
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--tx3)',
              marginBottom: 5,
              fontWeight: 600,
            }}
          >
            {t.description}
          </div>
          <div
            style={{
              fontSize: 12,
              lineHeight: 1.55,
              color: 'var(--tx2)',
              whiteSpace: 'pre-wrap',
              maxHeight: 90,
              overflowY: 'auto',
            }}
          >
            {missionDescriptionText(mission.description, t)}
          </div>
        </div>
      </div>
    </div>
  )
}
