import type { OrderDetail } from '../../../types/orders'
import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
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
  mutate,
  amending,
  setAmending,
  setReason,
}: {
  writable: boolean
  data: { plan: ExecutionPlan; missions: MissionResponse[]; order: OrderDetail }
  busy: boolean
  saving: boolean
  setCreating: Dispatch<
    SetStateAction<{ replacesMissionId?: string | undefined } | null>
  >
  dirty: boolean
  mutate: (
    action: 'finalize' | 'amend' | 'cancel',
    missionId?: string | undefined,
  ) => Promise<void>
  amending: boolean
  setAmending: Dispatch<SetStateAction<boolean>>
  setReason: Dispatch<SetStateAction<string>>
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
                disabled={busy || saving}
                onClick={() => setCreating({})}
              >
                {t.addMission}
              </button>
              <button
                className="odm-btn odm-btn-p"
                disabled={
                  busy ||
                  saving ||
                  dirty ||
                  !data.plan.coverage.coverageReady ||
                  data.plan.blockers.length > 0
                }
                onClick={() => void mutate('finalize')}
              >
                {t.finalizePlan}
              </button>
            </>
          )}
          {writable && data.plan.planStatus === 'FINALIZED' && !amending && (
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
          )}
        </div>
      )}
    </>
  )
}
