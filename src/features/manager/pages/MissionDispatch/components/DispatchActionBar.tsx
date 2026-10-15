import { OrderIcon } from '../../../components/common/OrderIcon'
import type { DispatchStep } from '../liveDispatchHelpers'
import type { OrderDispatchContext } from '../orderDispatchContext'
import { useI18n } from '../../../../../shared/i18n'
import { dispatchActionBarMessages } from './DispatchActionBar.messages'

export function DispatchActionBar({
  stepHint,
  activeStep,
  activeStepIndex,
  goPrevious,
  goNext,
  busy,
  droneIds,
  hasAllRoles,
  orderContext,
  assign,
}: {
  stepHint: Record<DispatchStep, string>
  activeStep: DispatchStep
  activeStepIndex: number
  goPrevious: () => void
  goNext: () => void
  busy: boolean
  droneIds: string[]
  hasAllRoles: boolean
  orderContext: OrderDispatchContext | undefined
  assign: () => Promise<void>
}) {
  const { t } = useI18n(dispatchActionBarMessages)
  return (
    <div className="odm-or-actionbar">
      <div className="odm-or-actionbar-hint">
        <span className="odm-or-actionbar-hint-icon">
          <OrderIcon name="info" size={18} />
        </span>
        <span>{stepHint[activeStep]}</span>
      </div>
      <div className="odm-or-actionbar-actions">
        <button
          type="button"
          className="odm-or-btn odm-or-btn-ghost"
          disabled={activeStepIndex === 0}
          onClick={goPrevious}
        >
          {t.previous}
        </button>
        {activeStep !== 'confirm' ? (
          <button
            type="button"
            className="odm-or-btn odm-or-btn-blue"
            onClick={goNext}
          >
            {t.next}
            <OrderIcon name="chevron-right" size={16} />
          </button>
        ) : (
          <button
            type="button"
            className="odm-or-btn odm-or-btn-primary"
            disabled={
              busy ||
              droneIds.length === 0 ||
              !hasAllRoles ||
              (orderContext && !orderContext.canAssign)
            }
            onClick={() => void assign()}
          >
            {busy ? t.assigning : t.assign}
          </button>
        )}
      </div>
    </div>
  )
}
