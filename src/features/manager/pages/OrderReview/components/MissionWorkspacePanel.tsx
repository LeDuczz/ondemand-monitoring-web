import { MissionPlanningCard } from './MissionPlanningCard'
import { MissionChecklistAssignmentEditor } from './MissionChecklistAssignmentEditor'
import { assignmentReadiness } from '../../../lib/assignmentReadiness'
import { ManagerMissionStopFlow } from './ManagerMissionStopFlow'
import { MissionExecutionPanel } from './MissionExecutionPanel'
import type { OrderDetail } from '../../../types/orders'
import type { MissionResponse } from '../../../types/missions'
import type { ExecutionPlan } from '../../../types/planning'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { missionWorkspacePanelMessages } from './MissionWorkspacePanel.messages'

export function MissionWorkspacePanel({
  mission,
  selected,
  scope,
  data,
  writable,
  busy,
  draft,
  query,
  updateDraft,
  runtimeBlocked,
  saving,
  dirty,
  onAssignResources,
  setAssigningResources,
  cancelCapabilities,
  cancelling,
  setCancelling,
  setReason,
  mutate,
  reason,
  setCreating,
  updateCancelCapability,
  updateRuntimeBlocked,
}: {
  mission: MissionResponse
  selected: string | undefined
  scope:
    | {
        missionId: string
        scopeLabel: string
        assignmentCount: number
        finalizedPlanRevision: number | null
      }
    | undefined
  data: { plan: ExecutionPlan; missions: MissionResponse[]; order: OrderDetail }
  writable: boolean
  busy: boolean
  draft: boolean
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
  }>
  updateDraft: (id: string, dirty: boolean, saving: boolean) => void
  runtimeBlocked: Record<string, boolean>
  saving: boolean
  dirty: boolean
  onAssignResources: ((missionId: string) => void) | undefined
  setAssigningResources: Dispatch<
    SetStateAction<{ missionId?: string | undefined } | null>
  >
  cancelCapabilities: Record<string, boolean>
  cancelling: string | null
  setCancelling: Dispatch<SetStateAction<string | null>>
  setReason: Dispatch<SetStateAction<string>>
  mutate: (
    action: 'finalize' | 'amend' | 'cancel',
    missionId?: string | undefined,
  ) => Promise<void>
  reason: string
  setCreating: Dispatch<
    SetStateAction<{ replacesMissionId?: string | undefined } | null>
  >
  updateCancelCapability: (missionId: string, canCancel: boolean) => void
  updateRuntimeBlocked: (id: string, blocked: boolean) => void
}) {
  const { t } = useI18n(missionWorkspacePanelMessages)

  return (
    <div hidden={mission.id !== selected}>
      <MissionPlanningCard
        mission={mission}
        scope={scope}
        missions={data.missions}
        key={mission.id}
      >
        <MissionChecklistAssignmentEditor
          missionId={mission.id}
          revision={data.plan.revision}
          editable={
            writable &&
            !busy &&
            draft &&
            scope?.finalizedPlanRevision == null &&
            mission.status === 'RESOURCE_ASSIGNING'
          }
          items={data.order.checklistItems ?? []}
          onChanged={query.reload}
          onDraftState={updateDraft}
        />
        {writable &&
          !busy &&
          runtimeBlocked[mission.id] === false &&
          data.plan.planStatus === 'FINALIZED' &&
          (scope?.finalizedPlanRevision ?? 0) > 0 &&
          ['RESOURCE_ASSIGNING', 'WAITING_CREW_CONFIRMATION'].includes(
            mission.status,
          ) && (
            <button
              className="odm-btn"
              disabled={busy || saving || dirty}
              onClick={() =>
                onAssignResources
                  ? onAssignResources(mission.id)
                  : setAssigningResources({
                      missionId: mission.id,
                    })
              }
            >
              {assignmentReadiness(mission).complete
                ? t.editAssignmentFor
                : t.assignResourcesFor}{' '}
              {mission.missionCode}
            </button>
          )}
        {((writable &&
          !['COMPLETED', 'CANCELLED'].includes(mission.status) &&
          cancelCapabilities[mission.id] === true &&
          runtimeBlocked[mission.id] === false) ||
          (cancelling === mission.id && runtimeBlocked[mission.id] !== true) ||
          (writable && draft && mission.status === 'CANCELLED')) && (
          <div className="odm-mission-actions">
            {writable &&
              !['COMPLETED', 'CANCELLED'].includes(mission.status) &&
              cancelCapabilities[mission.id] === true &&
              runtimeBlocked[mission.id] === false && (
                <button
                  className="odm-btn"
                  disabled={busy || saving || dirty}
                  onClick={() => {
                    setCancelling(mission.id)
                    setReason('')
                  }}
                >
                  {t.cancelMission}
                  {mission.missionCode}
                </button>
              )}
            {cancelling === mission.id &&
              runtimeBlocked[mission.id] !== true && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void mutate('cancel', mission.id)
                  }}
                >
                  <label>
                    {t.cancellationReason}
                    {mission.missionCode}
                    <textarea
                      required
                      maxLength={1000}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </label>
                  <button
                    className="odm-btn"
                    disabled={
                      busy ||
                      !reason.trim() ||
                      !writable ||
                      cancelCapabilities[mission.id] !== true
                    }
                  >
                    {t.confirmMissionCancellation}
                  </button>
                  <button
                    type="button"
                    className="odm-btn"
                    onClick={() => setCancelling(null)}
                  >
                    {t.close}
                  </button>
                </form>
              )}
            {writable && draft && mission.status === 'CANCELLED' && (
              <button
                type="button"
                className="odm-btn"
                disabled={busy || saving}
                onClick={() => setCreating({ replacesMissionId: mission.id })}
              >
                {t.createReplacementMissionFor}
                {mission.missionCode}
              </button>
            )}
          </div>
        )}
        <ManagerMissionStopFlow
          missionId={mission.id}
          missionCode={mission.missionCode || 'Mission'}
          status={mission.status}
          revision={data.plan.revision}
          refreshKey={data}
          writable={writable}
          draft={draft}
          active={mission.id === selected}
          blocked={busy || saving || dirty}
          onChanged={query.reload}
          onCapabilitiesChanged={updateCancelCapability}
          onRuntimeBlocked={updateRuntimeBlocked}
          onBusyChanged={updateDraft}
          onReplacement={(id) => setCreating({ replacesMissionId: id })}
        />
        {mission.id === selected && scope?.finalizedPlanRevision != null && (
          <MissionExecutionPanel key={mission.id} mission={mission} />
        )}
      </MissionPlanningCard>
    </div>
  )
}
