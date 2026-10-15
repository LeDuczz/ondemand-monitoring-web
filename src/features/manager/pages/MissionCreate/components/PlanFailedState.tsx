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
      <div className="odm-or-card">
        <div className="odm-mgr-review-error">
          <div className="odm-mgr-review-error-icon" aria-hidden="true">
            !
          </div>
          <div style={{ fontSize: 15, fontWeight: 600 }}>
            {t.planFailedTitle}
          </div>
          <div style={{ color: 'var(--tx3)', maxWidth: 420, lineHeight: 1.5 }}>
            {t.planFailedBody}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--tx3)',
              background: 'var(--sf3)',
              padding: '3px 8px',
              borderRadius: 5,
            }}
          >
            {submit.message}
          </div>
          <div style={{ marginTop: 6, display: 'flex', gap: 8 }}>
            <button
              type="button"
              className="odm-btn odm-btn-p"
              onClick={() => setSubmit({ kind: 'idle' })}
            >
              {t.retry}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
