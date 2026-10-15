import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import { setActiveMissionId } from '../../../api/liveMission'
import { formatDeviceLabel } from '../../../lib/deviceLabel'
import { operatorHref } from '../../../routes'
import type { OperatorMission } from '../../../types/mission'
import {
  missionHasSafeStop,
  missionStopLabel,
  missionMayTerminate,
} from '../../../../mission/lib/missionOperationalState'
import { latestMissionStatus, railStatusTone } from '../missionListHelpers'
import { nextFlightCardMessages } from './NextFlightCard.messages'

type Messages = (typeof nextFlightCardMessages)['vi']

function railActionFor(mission: OperatorMission, t: Messages) {
  const status = latestMissionStatus(mission)
  const permissions = mission.permissions
  if (missionHasSafeStop(mission)) {
    return {
      label: missionMayTerminate(mission, permissions?.canTerminateFlight)
        ? t.stopFlight
        : t.viewStopStatus,
      href: operatorHref({
        screen: missionMayTerminate(mission, permissions?.canTerminateFlight)
          ? 'flight'
          : 'missionDetail',
        missionId: mission.id,
      }),
    }
  }
  if (
    permissions?.canMaintainDevice &&
    (status === 'RETURNING' || status === 'POSTFLIGHT_CHECKING')
  ) {
    return {
      label: t.inspect,
      href: operatorHref({ screen: 'postflight', missionId: mission.id }),
    }
  }
  if (
    status === 'PENDING_REVIEW' &&
    (permissions?.canUploadMedia ||
      permissions?.canCompleteMission ||
      permissions?.canExecuteMonitoringChecklist)
  ) {
    return {
      label: t.reviewMedia,
      href: operatorHref({ screen: 'upload', missionId: mission.id }),
    }
  }
  if (
    permissions?.canControlFlight &&
    (status === 'IN_FLIGHT' ||
      status === 'IN_PROGRESS' ||
      status === 'RETURNING')
  ) {
    return {
      label: t.openCockpit,
      href: operatorHref({ screen: 'flight', missionId: mission.id }),
    }
  }
  if (permissions?.canOperatePayload && status === 'READY_TO_FLY') {
    return {
      label: t.handover,
      href: operatorHref({ screen: 'handover', missionId: mission.id }),
    }
  }
  if (
    permissions?.canOperatePayload &&
    (status === 'CONNECTED' ||
      status === 'PREFLIGHT_CHECKING' ||
      status === 'FAILED_PREFLIGHT')
  ) {
    return {
      label: t.precheck,
      href: operatorHref({ screen: 'preflight', missionId: mission.id }),
    }
  }
  if (permissions?.canOperatePayload) {
    return {
      label: t.connect,
      href: operatorHref({ screen: 'connect', missionId: mission.id }),
    }
  }
  return {
    label: t.viewResult,
    href: operatorHref({ screen: 'missionDetail', missionId: mission.id }),
  }
}

export function NextFlightCard({
  mission,
  start,
  now,
  today,
}: {
  mission: OperatorMission
  start: Date
  now: Date
  today: string
}) {
  const { t, locale } = useI18n(nextFlightCardMessages)
  const totalMinutes = Math.max(
    0,
    Math.round((start.getTime() - now.getTime()) / 60000),
  )
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const dayLabel =
    mission.date === today ? t.today2 : start.toLocaleDateString(locale)
  const deviceLabel = formatDeviceLabel(mission)
  const status = latestMissionStatus(mission)
  const statusLabel =
    missionStopLabel(mission) ??
    (t.statusLabel as Record<string, string>)[status] ??
    (t.statusLabel as Record<string, string>)[mission.status] ??
    status
  const action = railActionFor(mission, t)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 6,
        }}
      >
        <span className="odm-mono" style={{ fontWeight: 600, fontSize: 12.5 }}>
          {mission.missionCode ?? mission.id}
        </span>
        <StatusBadge tone={railStatusTone(status)}>{statusLabel}</StatusBadge>
      </div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 8 }}>
        {t.timeLeft(hours, minutes)}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 2 }}>
        {mission.title}
      </div>
      <div
        className="odm-tn"
        style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 4 }}
      >
        {mission.startTime}–{mission.endTime} · {dayLabel}
      </div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 4 }}>
        {mission.location}
      </div>
      <div style={{ color: 'var(--tx3)', fontSize: 12, marginBottom: 12 }}>
        {deviceLabel ?? t.unassignedDevice}
      </div>
      <a
        className="odm-btn odm-btn-ok"
        style={{ width: '100%', justifyContent: 'center' }}
        href={action.href}
        onClick={() => setActiveMissionId(mission.id)}
      >
        {action.label}
      </a>
    </div>
  )
}
