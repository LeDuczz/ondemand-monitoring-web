import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../shared/i18n'
import { setActiveMissionId } from '../api/liveMission'
import { formatDeadline } from '../lib/formatDeadline'
import { operatorHref } from '../routes'
import type { OperatorMission } from '../types/mission'
import { missionListTableMessages } from './MissionListTable.messages'

const STATUS_TONE = {
  PENDING: 'gray',
  ACCEPTED: 'green',
  IN_FLIGHT: 'blue',
  COMPLETED: 'green',
  REJECTED: 'red',
  FAILED: 'red',
} as const

type Messages = (typeof missionListTableMessages)['vi']

function actionFor(mission: OperatorMission, t: Messages) {
  const backendStatus = mission.backendStatus
  if (
    backendStatus === 'IN_FLIGHT' ||
    backendStatus === 'IN_PROGRESS' ||
    backendStatus === 'RETURNING'
  ) {
    return {
      label: t.action.openCockpit,
      cls: 'odm-btn-bl',
      href: operatorHref({ screen: 'flight', missionId: mission.id }),
    }
  }
  if (backendStatus === 'READY_TO_FLY') {
    return {
      label: t.action.handover,
      cls: 'odm-btn-ok',
      href: operatorHref({ screen: 'handover', missionId: mission.id }),
    }
  }
  if (
    backendStatus === 'PREFLIGHT_CHECKING' ||
    backendStatus === 'FAILED_PREFLIGHT'
  ) {
    return {
      label: t.action.preflight,
      cls: 'odm-btn-ok',
      href: operatorHref({ screen: 'preflight', missionId: mission.id }),
    }
  }
  if (backendStatus === 'CONNECTED') {
    return {
      label: t.action.preflight,
      cls: 'odm-btn-ok',
      href: operatorHref({ screen: 'preflight', missionId: mission.id }),
    }
  }

  switch (mission.status) {
    case 'PENDING':
      return {
        label: t.action.respond,
        cls: 'odm-btn-p',
        href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
      }
    case 'IN_FLIGHT':
      return {
        label: t.action.openCockpit,
        cls: 'odm-btn-bl',
        href: operatorHref({ screen: 'flight', missionId: mission.id }),
      }
    case 'ACCEPTED': {
      if (!mission.date || !mission.startTime)
        return {
          label: t.action.details,
          cls: '',
          href: operatorHref({
            screen: 'missionDetail',
            missionId: mission.id,
          }),
        }
      const start = new Date(`${mission.date}T${mission.startTime}:00+07:00`)
      const soon = start.getTime() - Date.now() < 4 * 60 * 60 * 1000
      return soon
        ? {
            label: t.action.start,
            cls: 'odm-btn-ok',
            href: operatorHref({ screen: 'connect', missionId: mission.id }),
          }
        : {
            label: t.action.details,
            cls: '',
            href: operatorHref({
              screen: 'missionDetail',
              missionId: mission.id,
            }),
          }
    }
    case 'COMPLETED':
    case 'FAILED':
      return {
        label: t.action.details,
        cls: '',
        href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
      }
    default:
      return null
  }
}

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

export function MissionListTable({
  missions,
  now,
}: {
  missions: OperatorMission[]
  now: Date
}) {
  const { t, lang, locale } = useI18n(missionListTableMessages)
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
      style={{ borderTop: 0, borderRadius: '0 0 8px 8px' }}
    >
      <table className="odm-table">
        <thead>
          <tr>
            <th style={{ width: 150 }}>{t.columns.code}</th>
            <th>{t.columns.job}</th>
            <th style={{ width: 170 }}>{t.columns.time}</th>
            <th style={{ width: 130 }}>{t.columns.service}</th>
            <th style={{ width: 140 }}>{t.columns.drone}</th>
            <th style={{ width: 130 }}>{t.columns.status}</th>
            <th style={{ width: 160 }}>{t.columns.deadline}</th>
            <th style={{ width: 110, textAlign: 'right' }} />
          </tr>
        </thead>
        <tbody>
          {missions.map((mission) => {
            const action = actionFor(mission, t)
            return (
              <tr key={mission.id}>
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
                <td>
                  <div style={{ fontWeight: 600 }}>{mission.title}</div>
                  <div
                    style={{
                      color: 'var(--tx3)',
                      fontSize: 11.5,
                      marginTop: 2,
                    }}
                  >
                    {mission.location}
                  </div>
                </td>
                <td>
                  <div className="odm-tn">
                    {weekdayDdMm(mission.date, today, t, locale)}
                  </div>
                  <div
                    className="odm-tn"
                    style={{ color: 'var(--tx3)', fontSize: 11.5 }}
                  >
                    {mission.startTime && mission.endTime
                      ? `${mission.startTime}–${mission.endTime}`
                      : '—'}
                  </div>
                </td>
                <td>
                  <span className="odm-opr-chip">{mission.serviceLabel}</span>
                </td>
                <td>
                  {mission.droneCode ? (
                    <>
                      {mission.droneName &&
                      mission.droneName !== mission.droneCode
                        ? `${mission.droneCode} ${mission.droneName}`
                        : mission.droneCode}
                    </>
                  ) : (
                    <span style={{ color: 'var(--tx3)' }}>{t.unassigned}</span>
                  )}
                </td>
                <td>
                  <StatusBadge tone={STATUS_TONE[mission.status]}>
                    {t.statusLabel[mission.status]}
                  </StatusBadge>
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
          })}
        </tbody>
      </table>
    </div>
  )
}
