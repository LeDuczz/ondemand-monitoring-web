import { MissionCreatePage } from '../../MissionCreate/MissionCreatePage'
import type { OrderDetail } from '../../../types/orders'
import type { Confirmation } from '../../../components/common/usePlanningConfirmation'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { ExecutionPlan } from '../../../types/planning'
import type { MissionResponse } from '../../../types/missions'
import { useI18n } from '../../../../../shared/i18n'
import { createMissionSectionMessages } from './CreateMissionSection.messages'

export function CreateMissionSection({
  creating,
  confirm,
  setCreating,
  orderId,
  setSelectedId,
  query,
}: {
  creating: { replacesMissionId?: string | undefined } | null
  confirm: (next: Confirmation) => Promise<boolean>
  setCreating: Dispatch<
    SetStateAction<{ replacesMissionId?: string | undefined } | null>
  >
  orderId: string
  setSelectedId: Dispatch<SetStateAction<string | null>>
  query: UseApiQueryState<{
    plan: ExecutionPlan
    missions: MissionResponse[]
    order: OrderDetail
  }>
}) {
  const { t } = useI18n(createMissionSectionMessages)

  return (
    <>
      {creating && (
        <section aria-label={t.createAMissionInThe}>
          <button
            className="odm-btn"
            type="button"
            onClick={async () => {
              if (
                await confirm({
                  title: t.closeTheMissionCreationForm,
                  body: t.unsentDataWillNotBe,
                  action: t.closeForm,
                })
              )
                setCreating(null)
            }}
          >
            {t.dongFormTaoMission2}
          </button>
          <MissionCreatePage
            orderId={orderId}
            replacesMissionId={creating.replacesMissionId}
            onCreated={(id) => {
              setSelectedId(id)
              setCreating(null)
              query.reload()
            }}
          />
        </section>
      )}
    </>
  )
}
