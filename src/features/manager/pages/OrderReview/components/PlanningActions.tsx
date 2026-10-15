import type { PlanningWorkspaceData } from '../planningWorkspaceData'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { planningActionsMessages } from './PlanningActions.messages'

export function PlanningActions({
  writable,
  data,
  busy,
  saving,
  setCreating,
  dirty,
  amending,
  setAmending,
  setReason,
  creating,
  selected,
  onContinue,
  onAssignResources,
  setAssigningResources,
}: {
  writable: boolean
  data: PlanningWorkspaceData
  busy: boolean
  saving: boolean
  setCreating: Dispatch<
    SetStateAction<{ replacesMissionId?: string | undefined } | null>
  >
  dirty: boolean
  amending: boolean
  setAmending: Dispatch<SetStateAction<boolean>>
  setReason: Dispatch<SetStateAction<string>>
  /** A Mission creation form is open. */
  creating: boolean
  selected: string | undefined
  onContinue: () => Promise<void>
  onAssignResources: ((missionId: string) => void) | undefined
  setAssigningResources: Dispatch<SetStateAction<{ missionId: string } | null>>
}) {
  const { t } = useI18n(planningActionsMessages)

  return (
    <>
      {writable && (
        <div className="odm-planning-actions">
          {writable && data.plan.planStatus === 'DRAFT' && (
            <>
              <button
                type="button"
                className="odm-btn"
                disabled={busy || saving || creating}
                onClick={() => setCreating({})}
              >
                {creating ? t.creatingMission : t.addMission}
              </button>
              <button
                type="button"
                className="odm-btn odm-btn-p"
                disabled={busy || saving || creating}
                onClick={() => void onContinue()}
              >
                {t.continueToResources}
              </button>
            </>
          )}
          {writable && data.plan.planStatus === 'FINALIZED' && !amending && (
            <>
              <button
                className="odm-btn"
                disabled={busy}
                onClick={() => {
                  setAmending(true)
                  setReason('')
                }}
              >
                {t.adjustPlan}
              </button>
              {selected && (
                <button
                  className="odm-btn odm-btn-p odm-planning-next-resource"
                  disabled={busy || saving || dirty}
                  onClick={() =>
                    onAssignResources
                      ? onAssignResources(selected)
                      : setAssigningResources({ missionId: selected })
                  }
                >
                  {t.assignResourcesFor}{' '}
                  {data.missions.find((mission) => mission.id === selected)
                    ?.missionCode ?? 'Mission'}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </>
  )
}
