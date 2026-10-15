import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { missionStatusTone } from '../../../../../shared/lib/statusTone'
import { useI18n } from '../../../../../shared/i18n'
import { setActiveMissionId } from '../../../api/liveMission'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import { formatDeadline } from '../../../lib/formatDeadline'
import { operatorHref } from '../../../routes'
import type { OperatorMission } from '../../../types/mission'
import { missionStopLabel } from '../../../../mission/lib/missionOperationalState'
import { actionFor } from './missionListActions'
import { missionListRowMessages } from './MissionListRow.messages'

const STATUS_TONE = {
  ...missionStatusTone,
  UNKNOWN: 'gray',
  PENDING: 'gray',
  ACCEPTED: 'green',
  IN_FLIGHT: 'blue',
  COMPLETED: 'green',
  REJECTED: 'red',
  FAILED: 'red',
} as const

const MANAGER_SUBMISSION_TONE = {
  NEEDS_SUBMIT: 'yellow',
  PENDING_MANAGER: 'blue',
  SENT_TO_CUSTOMER: 'green',
} as const

type Messages = (typeof missionListRowMessages)['vi']

function weekdayDdMm(
  dateStr: string,
  today: string,
  t: Messages,
  locale: string,
): string {
  if (!dateStr) return t.unscheduled
  const d = new Date(`${dateStr}T00:00:00+07:00`)
  if (dateStr === today) return t.today(d.toLocaleDateString(locale))
  return `${t.weekdays[d.getDay()]}, ${d.toLocaleDateString(locale)}`
}

export function MissionListRow({
  mission,
  today,
  now,
}: {
  mission: OperatorMission
  today: string
  now: Date
}) {
  const { t, lang, locale } = useI18n(missionListRowMessages)
  const action = actionFor(mission, t)
  const deviceLabel = formatDeviceLabel(mission)

  return (
    <tr>
      <td>
        <a
          className="odm-mono"
          href={operatorHref({
            screen: 'missionDetail',
            missionId: mission.id,
          })}
          onClick={() => setActiveMissionId(mission.id)}
          style={{
            fontWeight: 600,
            color: 'var(--blue)',
            textDecoration: 'none',
          }}
        >
          {mission.missionCode ?? mission.id}
        </a>
      </td>
      <td className="odm-opr-mission-job">
        <div className="odm-opr-mission-title">{mission.title}</div>
        <div className="odm-opr-mission-location">{mission.location}</div>
      </td>
      <td>
        <div className="odm-tn">
          {weekdayDdMm(mission.date, today, t, locale)}
        </div>
        <div className="odm-tn" style={{ color: 'var(--tx3)', fontSize: 11.5 }}>
          {mission.startTime && mission.endTime
            ? `${mission.startTime}–${mission.endTime}`
            : '—'}
        </div>
      </td>
      <td>
        <span className="odm-opr-chip">{mission.serviceLabel}</span>
      </td>
      <td className="odm-opr-mission-device">
        {deviceLabel ? (
          deviceLabel
        ) : (
          <span style={{ color: 'var(--tx3)' }}>{t.unassigned}</span>
        )}
      </td>
      <td>
        <StatusBadge tone={STATUS_TONE[mission.status]}>
          {missionStopLabel(mission) ??
            (mission.backendStatus === 'PENDING_REVIEW'
              ? t.awaitingReview
              : ((t.statusLabel as Record<string, string>)[mission.status] ??
                mission.backendStatus ??
                mission.status))}
        </StatusBadge>
      </td>
      <td>
        {mission.status === 'COMPLETED' || mission.status === 'FAILED' ? (
          <StatusBadge
            tone={
              MANAGER_SUBMISSION_TONE[
                mission.managerSubmissionStatus ?? 'NEEDS_SUBMIT'
              ]
            }
          >
            {
              t.managerSubmissionLabel[
                mission.managerSubmissionStatus ?? 'NEEDS_SUBMIT'
              ]
            }
          </StatusBadge>
        ) : (
          <span style={{ color: 'var(--tx3)' }}>—</span>
        )}
      </td>
      <td>
        <span className="odm-tn" style={{ fontWeight: 500 }}>
          {formatDeadline(mission, now, lang)}
        </span>
      </td>
      <td style={{ textAlign: 'right' }}>
        {action ? (
          <a
            className={`odm-btn odm-btn-sm ${action.cls}`}
            href={action.href}
            onClick={() => setActiveMissionId(mission.id)}
          >
            {action.label}
          </a>
        ) : null}
      </td>
    </tr>
  )
}
