import { StatusBadge } from '../../../shared/components/odm/StatusBadge'
import { missionStatusTone } from '../../../shared/lib/statusTone'
import { useI18n } from '../../../shared/i18n'
import { setActiveMissionId } from '../api/liveMission'
import { formatDeviceLabel } from '../lib/deviceLabel'
import { hasAcknowledgedHandover } from '../lib/flightWorkflowStorage'
import { formatDeadline } from '../lib/formatDeadline'
import { operatorHref } from '../routes'
import type { OperatorMission } from '../types/mission'
import { missionListTableMessages } from './MissionListTable.messages'
import {
  missionHasSafeStop,
  missionStopLabel,
  missionMayTerminate,
} from '../../mission/lib/missionOperationalState'

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

type Messages = (typeof missionListTableMessages)['vi']

function actionFor(mission: OperatorMission, t: Messages) {
  const backendStatus = mission.backendStatus
  const permissions = mission.permissions
  if (missionHasSafeStop(mission) || backendStatus === 'CANCELLED') {
    return missionMayTerminate(mission, permissions?.canTerminateFlight)
      ? {
          label: 'Dừng chuyến bay',
          cls: 'odm-btn-rd',
          href: operatorHref({ screen: 'flight', missionId: mission.id }),
        }
      : permissions?.canMaintainDevice &&
          backendStatus === 'POSTFLIGHT_CHECKING'
        ? {
            label: t.action.inspect,
            cls: '',
            href: operatorHref({ screen: 'postflight', missionId: mission.id }),
          }
        : {
            label: 'Xem trạng thái dừng',
            cls: '',
            href: operatorHref({
              screen: 'missionDetail',
              missionId: mission.id,
            }),
          }
  }
  if (backendStatus === 'PENDING_REVIEW' || backendStatus === 'COMPLETED') {
    return {
      label: t.action.viewResult,
      cls: '',
      href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
    }
  }
  if (permissions?.canStartMission && backendStatus === 'SCHEDULED') {
    return {
      label: t.action.startMission,
      cls: 'odm-btn-ok',
      href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
    }
  }
  if (permissions) {
    if (
      (backendStatus === 'PENDING_REVIEW' &&
        (permissions.canCompleteMission ||
          permissions.canSubmitMissionResult ||
          permissions.canExecuteMonitoringChecklist))
    ) {
      return {
        label: t.action.viewResult,
        cls: '',
        href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
      }
    }
    if (
      permissions.canMaintainDevice &&
      (backendStatus === 'RETURNING' || backendStatus === 'POSTFLIGHT_CHECKING')
    ) {
      return {
        label: t.action.inspect,
        cls: 'odm-btn-ok',
        href: operatorHref({ screen: 'postflight', missionId: mission.id }),
      }
    }
    if (
      permissions.canUploadMedia &&
      (backendStatus === 'PENDING_REVIEW' || backendStatus === 'COMPLETED')
    ) {
      return {
        label: t.action.reviewMedia,
        cls: 'odm-btn-p',
        href: operatorHref({ screen: 'upload', missionId: mission.id }),
      }
    }
    if (
      permissions.canInspectDevice ||
      permissions.canUploadMedia ||
      permissions.canMaintainDevice
    ) {
      return {
        label: t.action.details,
        cls: '',
        href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
      }
    }
    if (
      permissions.canControlFlight &&
      (backendStatus === 'READY_TO_FLY' ||
        backendStatus === 'IN_FLIGHT' ||
        backendStatus === 'IN_PROGRESS' ||
        backendStatus === 'RETURNING')
    ) {
      return {
        label: t.action.openCockpit,
        cls: 'odm-btn-bl',
        href: operatorHref({ screen: 'flight', missionId: mission.id }),
      }
    }
    if (permissions.canOperatePayload) {
      if (backendStatus === 'READY_TO_FLY') {
        if (hasAcknowledgedHandover(mission.id)) {
          return {
            label: t.action.details,
            cls: '',
            href: operatorHref({
              screen: 'missionDetail',
              missionId: mission.id,
            }),
          }
        }
        return {
          label: t.action.handover,
          cls: 'odm-btn-ok',
          href: operatorHref({ screen: 'handover', missionId: mission.id }),
        }
      }
      if (
        backendStatus === 'CONNECTED' ||
        backendStatus === 'PREFLIGHT_CHECKING' ||
        backendStatus === 'FAILED_PREFLIGHT'
      ) {
        return {
          label: t.action.preflight,
          cls: 'odm-btn-ok',
          href: operatorHref({ screen: 'preflight', missionId: mission.id }),
        }
      }
      if (backendStatus === 'SCHEDULED') {
        return {
          label: t.action.start,
          cls: 'odm-btn-ok',
          href: operatorHref({ screen: 'connect', missionId: mission.id }),
        }
      }
    }
  }
  // A lifecycle status alone never grants operational permission.
  return {
    label: t.action.details,
    cls: '',
    href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
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
      style={{ borderTop: 0, borderRadius: '0 0 8px 8px', overflowX: 'auto' }}
    >
      <table className="odm-table odm-opr-mission-table">
        <thead>
          <tr>
            <th className="odm-opr-mission-code">{t.columns.code}</th>
            <th className="odm-opr-mission-job">{t.columns.job}</th>
            <th className="odm-opr-mission-time">{t.columns.time}</th>
            <th className="odm-opr-mission-service">{t.columns.service}</th>
            <th className="odm-opr-mission-device">{t.columns.drone}</th>
            <th className="odm-opr-mission-status">{t.columns.status}</th>
            <th className="odm-opr-mission-manager">
              {t.columns.managerSubmission}
            </th>
            <th className="odm-opr-mission-deadline">{t.columns.deadline}</th>
            <th className="odm-opr-mission-action" />
          </tr>
        </thead>
        <tbody>
          {missions.map((mission) => {
            const action = actionFor(mission, t)
            const deviceLabel = formatDeviceLabel(mission)
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
                <td className="odm-opr-mission-job">
                  <div className="odm-opr-mission-title">{mission.title}</div>
                  <div className="odm-opr-mission-location">
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
                        ? lang === 'vi'
                          ? 'Chờ nghiệm thu'
                          : 'Awaiting review'
                        : ((t.statusLabel as Record<string, string>)[
                            mission.status
                          ] ??
                          mission.backendStatus ??
                          mission.status))}
                  </StatusBadge>
                </td>
                <td>
                  {mission.status === 'COMPLETED' ||
                  mission.status === 'FAILED' ? (
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
          })}
        </tbody>
      </table>
    </div>
  )
}
