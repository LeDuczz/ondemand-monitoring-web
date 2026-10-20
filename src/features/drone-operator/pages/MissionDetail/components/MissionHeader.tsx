import { StatusBadge } from '../../../../../shared/components/odm/StatusBadge'
import { useI18n } from '../../../../../shared/i18n'
import {
  missionHasSafeStop,
  missionMayTerminate,
} from '../../../../mission/lib/missionOperationalState'
import type { MissionPermissions } from '../../../../mission/types/permissions'
import { operatorHref } from '../../../routes'
import type { OperatorMission } from '../../../types/mission'
import { missionHeaderMessages } from './MissionHeader.messages'
import { MissionStatusBadge } from './MissionStatusBadge'

const GCS_CONNECTED_STATUSES = new Set([
  'PENDING_REVIEW',
  'CONNECTED',
  'PREFLIGHT_CHECKING',
  'READY_TO_FLY',
  'IN_FLIGHT',
  'IN_PROGRESS',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'COMPLETED',
])

const INSPECTION_MEDIA_STATUSES = new Set([
  'PENDING_REVIEW',
  'RETURNING',
  'POSTFLIGHT_CHECKING',
  'COMPLETED',
])

function missionProgressBadge(
  status: string | null | undefined,
  t: typeof missionHeaderMessages.vi,
) {
  if (status === 'CONNECTED') {
    return { tone: 'blue' as const, label: t.progressConnected }
  }
  if (status === 'PREFLIGHT_CHECKING') {
    return { tone: 'blue' as const, label: t.progressPreflight }
  }
  if (status === 'READY_TO_FLY') {
    return { tone: 'green' as const, label: t.progressReady }
  }
  return null
}

export function MissionHeader({
  mission,
  access,
  submitting,
  onStartWorkflow,
}: {
  mission: OperatorMission
  access?: MissionPermissions
  submitting?: boolean
  onStartWorkflow?: () => void
}) {
  const { t } = useI18n(missionHeaderMessages)
  const hasAccepted = mission.myResponseStatus === 'ACCEPTED'
  const stopping = missionHasSafeStop(mission)
  const progressBadge = stopping
    ? null
    : missionProgressBadge(mission.backendStatus, t)
  const backendStatus = mission.backendStatus ?? mission.status
  const canConnectGcs =
    !stopping &&
    access?.canOperatePayload === true &&
    backendStatus === 'SCHEDULED' &&
    !GCS_CONNECTED_STATUSES.has(backendStatus)
  const canRunPreflight =
    !stopping &&
    access?.canOperatePayload === true &&
    ['CONNECTED', 'PREFLIGHT_CHECKING', 'FAILED_PREFLIGHT'].includes(
      backendStatus,
    )
  const canHandleInspectionMedia =
    access?.canInspectDevice === true ||
    access?.canCompleteMission === true ||
    (access?.canUploadMedia === true &&
      INSPECTION_MEDIA_STATUSES.has(mission.backendStatus ?? ''))
  const showProgressBadge =
    progressBadge &&
    !(access?.canInspectDevice === true || access?.canUploadMedia === true)
  return (
    <div className="mds-header">
      {/* Row 1: code + badge + actions */}
      <div className="mds-header-row">
        <a
          href={operatorHref({ screen: 'missions' })}
          className="odm-btn odm-btn-sm odm-btn-ic1"
          style={{ flexShrink: 0, fontSize: 16 }}
          title={t.backToList}
        >
          ←
        </a>
        <span
          className="odm-mono"
          style={{ fontWeight: 700, fontSize: 16, letterSpacing: '0.01em' }}
        >
          {mission.missionCode ?? mission.id}
        </span>
        <MissionStatusBadge mission={mission} />

        {/* spacer */}
        <div style={{ flex: 1 }} />
        {access?.canExecuteMonitoringChecklist === true &&
          !canHandleInspectionMedia && (
            <a
              className="odm-btn"
              href={operatorHref({ screen: 'upload', missionId: mission.id })}
            >
              {t.checklistAndMedia}
            </a>
          )}

        {canRunPreflight && (
          <a
            className="odm-btn"
            href={operatorHref({ screen: 'preflight', missionId: mission.id })}
          >
            {t.deviceCheck}
          </a>
        )}
        {access?.canMaintainDevice &&
          ['RETURNING', 'POSTFLIGHT_CHECKING'].includes(
            mission.backendStatus ?? '',
          ) && (
            <a
              className="odm-btn"
              href={operatorHref({
                screen: 'postflight',
                missionId: mission.id,
              })}
            >
              {t.postflightCheck}
            </a>
          )}
        {canHandleInspectionMedia && (
          <a
            className="odm-btn"
            href={operatorHref({ screen: 'upload', missionId: mission.id })}
          >
            {t.openAcceptanceMedia}
          </a>
        )}
        {showProgressBadge ? (
          <StatusBadge tone={progressBadge.tone}>
            {progressBadge.label}
          </StatusBadge>
        ) : null}
        {/* Action permissions come from the backend assignment policy. */}
        {stopping ? (
          missionMayTerminate(mission, access?.canTerminateFlight) ? (
            <a
              className="odm-btn odm-btn-rd"
              href={operatorHref({ screen: 'flight', missionId: mission.id })}
            >
              {t.stopFlight}
            </a>
          ) : null
        ) : hasAccepted &&
          (backendStatus === 'WAITING_CREW_CONFIRMATION' ||
            backendStatus === 'WAITING_OPERATOR_ACCEPTANCE') ? (
          access?.canStartMission ? (
            <button
              type="button"
              className="odm-btn odm-btn-p"
              disabled={submitting}
              onClick={onStartWorkflow}
            >
              {submitting ? t.startingMission : t.startMission}
            </button>
          ) : (
            <StatusBadge tone="green">{t.accepted}</StatusBadge>
          )
        ) : mission.status === 'PENDING' ? null : mission.backendStatus ===
            'READY_TO_FLY' && access?.canControlFlight ? (
          <a
            className="odm-btn odm-btn-p"
            href={operatorHref({ screen: 'flight', missionId: mission.id })}
          >
            {t.openCockpit}
          </a>
        ) : canConnectGcs ? (
          <a
            className="odm-btn odm-btn-p mds-cta"
            href={operatorHref({ screen: 'connect', missionId: mission.id })}
          >
            {t.connectGcs}
          </a>
        ) : mission.status === 'IN_FLIGHT' ? (
          <>
            {access?.canUploadMedia && (
              <a
                className="odm-btn"
                href={operatorHref({ screen: 'upload', missionId: mission.id })}
              >
                {t.reviewMedia}
              </a>
            )}
            {access?.canControlFlight && (
              <a
                className="odm-btn odm-btn-p"
                href={operatorHref({ screen: 'flight', missionId: mission.id })}
              >
                {t.openCockpit}
              </a>
            )}
          </>
        ) : null}
      </div>
    </div>
  )
}
