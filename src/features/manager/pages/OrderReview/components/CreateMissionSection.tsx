import { MissionCreatePage } from '../../MissionCreate/MissionCreatePage'
import type { Confirmation } from '../../../components/common/usePlanningConfirmation'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import type { UseApiQueryState } from '../../../../../shared/hooks/useApiQuery'
import type { PlanningWorkspaceData } from '../planningWorkspaceData'
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
  query: UseApiQueryState<PlanningWorkspaceData>
}) {
  const { t } = useI18n(createMissionSectionMessages)

  return (
    <>
      {creating && (
        <section
          className="odm-planning-create-panel"
          aria-label={t.createAMissionInThe}
        >
          <header className="odm-planning-create-head">
            <span className="odm-planning-create-icon" aria-hidden="true">
              ＋
            </span>
            <div>
              <h3>{t.createTitle}</h3>
              <p>{t.createHint}</p>
            </div>
            <button
              className="odm-planning-create-close"
              type="button"
              aria-label={t.dongFormTaoMission2}
              title={t.closeForm}
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
              ×
            </button>
          </header>
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
