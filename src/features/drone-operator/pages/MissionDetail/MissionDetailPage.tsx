import { useEffect } from 'react'

import {
  EmptyState,
  LoadingState,
} from '../../../../shared/components/odm/StateView'
import { useI18n } from '../../../../shared/i18n'
import { useApiQuery } from '../../../../shared/hooks/useApiQuery'
import { SafeStopPanel } from '../../../manager/components/common/SafeStopPanel'
import '../../../manager/components/common/planning.css'
import { MonitoringChecklistSection } from '../../../mission/components/MonitoringChecklistSection'
import { useMissionMonitoring } from '../../../mission/hooks/useMissionMonitoring'
import { operatorApi } from '../../api/operatorApi'
import { setActiveMissionId } from '../../api/liveMission'
import {
  MissionResultActions,
  missionResultActions,
  staffResultError,
} from '../../components/common/MissionResultActions'
import { operatorHref } from '../../routes'
import { MissionDashboard } from './components/MissionDashboard'
import { RejectDialog } from './components/RejectDialog'
import { SafeStopPostflightPrompt } from './components/SafeStopPostflightPrompt'
import { missionDetailPageMessages } from './MissionDetailPage.messages'
import { useMissionDetailActions } from './useMissionDetailActions'

export function MissionDetailPage({ missionId }: { missionId: string }) {
  return <MissionDetailContent key={missionId} missionId={missionId} />
}

function MissionDetailContent({ missionId }: { missionId: string }) {
  const { t } = useI18n(missionDetailPageMessages)
  const query = useApiQuery(
    (signal) => operatorApi.getMission(missionId, signal),
    [missionId],
  )
  const monitoring = useMissionMonitoring(missionId, undefined, {
    autoRefresh: false,
  })
  const resultApprovalStatus = monitoring.data?.result?.approvalStatus ?? null
  const monitoringKnown =
    !monitoring.loading && !monitoring.error && Boolean(monitoring.data)
  const actions = missionResultActions(
    missionId,
    query.data?.backendStatus ?? query.data?.status,
    monitoring,
  )
  const {
    showReject,
    setShowReject,
    submitting,
    resultSubmitting,
    mediaRevision,
    actionError,
    refreshWorkspace,
    handleAccept,
    handleReject,
    handleCompleteMission,
    handleSubmitResult,
    handlePrepareSafeStopPostflight,
  } = useMissionDetailActions({
    reloadMission: () => query.reload(),
    reloadMonitoring: () => monitoring.reload(),
    completeReady: actions.completeReady,
    submitReady: actions.submitReady,
  })

  useEffect(() => {
    setActiveMissionId(missionId)
  }, [missionId])

  if (query.loading && !query.data) return <LoadingState />
  if (query.error || !query.data || query.data.id !== missionId) {
    return (
      <EmptyState
        title={t.errorTitle}
        description={t.errorDescription}
        action={
          <a
            className="odm-btn odm-btn-p"
            href={operatorHref({ screen: 'missions' })}
          >
            {t.backToList}
          </a>
        }
      />
    )
  }

  const mission = query.data

  return (
    <>
      <MissionDashboard
        mission={mission}
        submitting={submitting}
        actionError={
          actionError
            ? typeof actionError === 'string'
              ? actionError
              : staffResultError(actionError)
            : null
        }
        access={actions.known ? monitoring.data?.permissions : undefined}
        resultActions={
          <MissionResultActions
            missionId={missionId}
            status={mission.backendStatus ?? mission.status}
            monitoring={monitoring}
            busy={submitting || resultSubmitting || query.loading}
            onComplete={() => void handleCompleteMission(mission)}
            onSubmit={() => void handleSubmitResult(mission)}
          />
        }
        monitoringSection={
          <MonitoringChecklistSection
            missionId={mission.id}
            data={monitoring.data?.checklist}
            loading={monitoring.loading}
            error={monitoring.error}
            canExecute={
              monitoring.data?.permissions.canExecuteMonitoringChecklist
            }
            canAttach={monitoring.data?.permissions.canAttachChecklistEvidence}
            canDetach={monitoring.data?.permissions.canDetachChecklistEvidence}
            resultStatus={resultApprovalStatus}
            resultNote={monitoring.data?.result?.reviewNote}
            resultKnown={monitoringKnown}
            refresh={refreshWorkspace}
          />
        }
        resultApprovalStatus={resultApprovalStatus}
        refreshWorkspace={refreshWorkspace}
        mediaRevision={mediaRevision}
        onAccept={() => void handleAccept(mission)}
        onOpenReject={() => setShowReject(true)}
      />

      {actions.known &&
        monitoring.data?.permissions.canPrepareSafeStopPostflight === true && (
          <SafeStopPostflightPrompt
            submitting={submitting}
            onPrepare={() => void handlePrepareSafeStopPostflight(mission)}
          />
        )}
      <SafeStopPanel
        key={mission.id}
        missionId={mission.id}
        onChanged={() => {
          query.reload()
          monitoring.reload()
        }}
      />

      {showReject ? (
        <RejectDialog
          missionId={mission.id}
          submitting={submitting}
          onCancel={() => setShowReject(false)}
          onConfirm={(reason, notes) => handleReject(mission, reason, notes)}
        />
      ) : null}
    </>
  )
}
