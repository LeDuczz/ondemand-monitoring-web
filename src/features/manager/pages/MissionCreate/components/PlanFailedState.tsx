import { Card } from '../../../../../shared/components/ui'
import { OrderWorkflowStepper } from '../../../components/common/OrderWorkflowStepper'
import type { SubmitState } from '../createMissionHelpers'
import type { Dispatch } from 'react'
import type { SetStateAction } from 'react'
import { useI18n } from '../../../../../shared/i18n'
import { planFailedStateMessages } from './PlanFailedState.messages'

export function PlanFailedState({
  onCreated,
  submit,
  setSubmit,
}: {
  onCreated: ((missionId: string) => void) | undefined
  submit: { kind: 'planFailed'; message: string }
  setSubmit: Dispatch<SetStateAction<SubmitState>>
}) {
  const { t } = useI18n(planFailedStateMessages)
  return (
    <div className="odm-or">
      {!onCreated && <OrderWorkflowStepper currentStep={2} />}
      <Card>
        <div className="odm-or-load-error" role="alert">
          <strong>{t.planFailedTitle}</strong>
          <p>{t.planFailedBody}</p>
          <code className="odm-plan-code">{submit.message}</code>
          <button
            type="button"
            className="odm-btn odm-btn-p"
            onClick={() => setSubmit({ kind: 'idle' })}
          >
            {t.retry}
          </button>
        </div>
      </Card>
    </div>
  )
}
