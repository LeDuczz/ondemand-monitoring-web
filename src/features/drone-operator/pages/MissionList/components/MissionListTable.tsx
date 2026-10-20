import { useI18n } from '../../../../../shared/i18n'
import type { OperatorMission } from '../../../types/mission'
import { MissionListRow } from './MissionListRow'
import { missionListTableMessages } from './MissionListTable.messages'

export function MissionListTable({
  missions,
  now,
  showSubmission = true,
}: {
  missions: OperatorMission[]
  now: Date
  /** The "sent to manager" column only matters once a Mission is finished. */
  showSubmission?: boolean
}) {
  const { t } = useI18n(missionListTableMessages)
  const today = now.toISOString().slice(0, 10)

  if (missions.length === 0) {
    return (
      <div
        className="odm-card"
        style={{ borderTop: 0, borderRadius: '0 0 8px 8px' }}
      >
        <div
          className="odm-card-body"
          style={{ padding: '48px 24px', textAlign: 'center' }}
        >
          <div style={{ fontWeight: 600, marginBottom: 6 }}>{t.emptyTitle}</div>
          <div style={{ color: 'var(--tx3)' }}>{t.emptyBody}</div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="odm-card"
      style={{ borderTop: 0, borderRadius: '0 0 8px 8px', overflowX: 'auto' }}
    >
      <table className="odm-table odm-opr-mission-table">
        <thead>
          <tr>
            <th className="odm-opr-mission-code">{t.columns.code}</th>
            <th className="odm-opr-mission-job">{t.columns.job}</th>
            <th className="odm-opr-mission-time">{t.columns.time}</th>
            <th className="odm-opr-mission-device">{t.columns.drone}</th>
            <th className="odm-opr-mission-status">{t.columns.status}</th>
            {showSubmission && (
              <th className="odm-opr-mission-manager">
                {t.columns.managerSubmission}
              </th>
            )}
            <th className="odm-opr-mission-deadline">{t.columns.deadline}</th>
            <th className="odm-opr-mission-action" />
          </tr>
        </thead>
        <tbody>
          {missions.map((mission) => (
            <MissionListRow
              key={mission.id}
              mission={mission}
              today={today}
              now={now}
              showSubmission={showSubmission}
            />
          ))}
        </tbody>
      </table>
    </div>
  )
}
