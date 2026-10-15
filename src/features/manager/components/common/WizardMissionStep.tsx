import type { ReactNode } from 'react'
import { OrderWorkflowStepper } from './OrderWorkflowStepper'
import { DispatchWizardTabs } from '../../pages/MissionDispatch/components/DispatchWizardTabs'
import type { Confirmation } from './usePlanningConfirmation'
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
      <div className="odm-or-pagehead odm-or-pagehead-row">
        <h1 className="odm-or-title">{t.assignResources}</h1>
        <button
          className="odm-or-btn-outline"
          disabled={busy}
          onClick={() => leave(true)}
        >
          {returnLabel}
        </button>
      </div>
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
          <button className="odm-or-btn odm-or-btn-blue" onClick={onClose}>
            {t.finishAssignment}
          </button>
        </div>
      )}
      <div className="odm-or-actionbar">
        <div className="odm-or-actionbar-hint">{t.chonDungNhiemVuTruoc}</div>
        <button
          className="odm-or-btn odm-or-btn-blue"
          disabled={!candidateId || !eligible(candidateId)}
          onClick={next}
        >
          {t.next}
        </button>
      </div>
    </div>
  )
}
