import type { ReactNode } from 'react'
import { PageHeader } from '../../../../shared/components/ui'
import { OrderWorkflowStepper } from './OrderWorkflowStepper'
import { DispatchWizardTabs } from '../../pages/MissionDispatch/components/DispatchWizardTabs'
import type { Confirmation } from './usePlanningConfirmation'
import '../../pages/MissionDispatch/missionDispatch.css'
import { useI18n } from '../../../../shared/i18n'
import { wizardMissionStepMessages } from './WizardMissionStep.messages'

export function WizardMissionStep({
  confirmation,
  busy,
  leave,
  returnLabel,
  selection,
  allAssigned,
  onClose,
  candidateId,
  eligible,
  next,
}: {
  confirmation: {
    confirm: (next: Confirmation) => Promise<boolean>
    dialog: ReactNode | null
  }
  busy: boolean
  leave: (close?: boolean) => Promise<void>
  returnLabel: string
  selection: ReactNode
  allAssigned: boolean
  onClose: () => void
  candidateId: string | null
  eligible: (id: string) => boolean
  next: () => boolean
}) {
  const { t } = useI18n(wizardMissionStepMessages)

  return (
    <div className="odm-or">
      {confirmation.dialog}
      <PageHeader
        back={
          <button
            type="button"
            className="odm-dp-back"
            disabled={busy}
            onClick={() => leave(true)}
          >
            {returnLabel}
          </button>
        }
        title={t.assignResources}
      />
      <OrderWorkflowStepper currentStep={3} />
      <DispatchWizardTabs
        activeStep="mission"
        selectionOnly
        onStep={(step) => {
          if (step === 'order') leave(true)
        }}
      />
      {selection}
      {allAssigned && (
        <div className="odm-planning-complete" role="status">
          <span>{t.allMissionsAreFullyAssigned}</span>
          <button className="odm-btn odm-btn-p" onClick={onClose}>
            {t.finishAssignment}
          </button>
        </div>
      )}
      <div className="odm-or-actionbar">
        <div className="odm-or-actionbar-hint">{t.chonDungNhiemVuTruoc}</div>
        <button
          className="odm-btn odm-btn-p"
          disabled={!candidateId || !eligible(candidateId)}
          onClick={next}
        >
          {t.next}
        </button>
      </div>
    </div>
  )
}
