import { MissionSelector } from './MissionSelector'
import { MissionWorkspacePanel } from './MissionWorkspacePanel'
import type { OrderDetail } from '../../../types/orders'
import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'

export function MissionWorkspaceGrid({
  data,
  selected,
  busy,
  saving,
  drafts,
  setSelectedId,
  writable,
  query,
  updateDraft,
  runtimeBlocked,
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
  data: { plan: ExecutionPlan; missions: MissionResponse[]; order: OrderDetail }
  selected: string | undefined
  busy: boolean
  saving: boolean
  drafts: Record<string, { dirty: boolean; busy: boolean }>
  setSelectedId: Dispatch<SetStateAction<string | null>>
  writable: boolean
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
  }>
  updateDraft: (id: string, dirty: boolean, saving: boolean) => void
  runtimeBlocked: Record<string, boolean>
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
  return (
    <div className="odm-planning-workspace">
      <MissionSelector
        missions={data.missions}
        plan={data.plan}
        selectedId={selected}
        noChecklist={!data.order.checklistItems?.length}
        disabled={busy || saving}
        drafts={drafts}
        onSelect={setSelectedId}
      />
      <div className="odm-workspace-panels">
        {data.missions.map((mission) => {
          const scope = data.plan.missions.find(
            (m) => m.missionId === mission.id,
          )
          const draft = data.plan.planStatus === 'DRAFT'
          return (
            <MissionWorkspacePanel
              key={mission.id}
              mission={mission}
              selected={selected}
              scope={scope}
              data={data}
              writable={writable}
              busy={busy}
              draft={draft}
              query={query}
              updateDraft={updateDraft}
              runtimeBlocked={runtimeBlocked}
              saving={saving}
              dirty={dirty}
              onAssignResources={onAssignResources}
              setAssigningResources={setAssigningResources}
              cancelCapabilities={cancelCapabilities}
              cancelling={cancelling}
              setCancelling={setCancelling}
              setReason={setReason}
              mutate={mutate}
              reason={reason}
              setCreating={setCreating}
              updateCancelCapability={updateCancelCapability}
              updateRuntimeBlocked={updateRuntimeBlocked}
            />
          )
        })}
      </div>
    </div>
  )
}
