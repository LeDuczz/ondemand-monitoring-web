import { useI18n } from '../../../../../shared/i18n'
import type { OperatorMission } from '../../../types/mission'
import { useMissionDateFormatter } from '../missionDate'
import { decisionSummaryMessages } from './DecisionSummary.messages'
import { locationLabel } from './MissionInfoCard'
import { missionInfoCardMessages } from './MissionInfoCard.messages'

function formatDeadline(value: string, locale: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString(locale, {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
  })
}

/** What the pilot needs to know before accepting or rejecting a mission. */
export function DecisionSummary({ mission }: { mission: OperatorMission }) {
  const { t, locale } = useI18n(decisionSummaryMessages)
  const { t: infoT } = useI18n(missionInfoCardMessages)
  const formatDate = useMissionDateFormatter()
  const time = [mission.startTime, mission.endTime].filter(Boolean).join('–')
  const items: Array<{ label: string; value: string }> = [
    { label: t.area, value: locationLabel(mission.location, infoT) },
    {
      label: t.time,
      value: [formatDate(mission.date), time].filter(Boolean).join(' · '),
    },
    {
      label: t.scope,
      value:
        mission.radiusMeters == null
          ? '—'
          : t.radius(Math.round(mission.radiusMeters)),
    },
    { label: t.missionType, value: mission.serviceLabel || '—' },
  ]
  if (mission.respondBy) {
    items.push({
      label: t.respondBy,
      value: formatDeadline(mission.respondBy, locale),
    })
  }
  if (mission.managerNote) {
    items.push({ label: t.managerNote, value: mission.managerNote })
  }
  return (
    <section className="odm-card mds-decision" aria-label={t.ariaLabel}>
      <div className="odm-card-header">
        <span style={{ fontWeight: 700 }}>{t.title}</span>
      </div>
      <dl className="mds-decision-grid" style={{ margin: 0 }}>
        {items.map((item) => (
          <div key={item.label} className="mds-decision-item">
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
